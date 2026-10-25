import { GM_xmlhttpRequest, type GmResponseEvent } from '$'
import type { Trace } from '@/services/debugLog'

/** A redirect that has not answered by now leaves the result on its original link. */
const RESOLVE_TIMEOUT_MS = 8_000

/** The `Location` of a redirect response, absolute against `url`; null when the headers carry none. */
function locationOf(headers: string, url: string): string | null {
  for (const line of headers.split('\n')) {
    const colon = line.indexOf(':')
    if (colon < 0) continue
    if (line.slice(0, colon).trim().toLowerCase() !== 'location') continue
    return new URL(line.slice(colon + 1).trim(), url).href
  }
  return null
}

/**
 * Where `url` redirects to, without contacting the target. Tampermonkey
 * checks the final URL of a followed redirect against `@connect` and refuses
 * every target outside it, after waiting for the target to answer (observed
 * 2026-10: ten results on Chrome, all refused, 7–16 s). `redirect: 'manual'`
 * stops at the first response and its `Location` names the target; a manager
 * without that option follows the redirect, and its `finalUrl` is the target,
 * read once the headers arrive so the target's page is never downloaded.
 * A same-page fetch cannot do either: the redirect leaves the origin and CORS
 * hides where it went. Called from the page that owns `url`, so `@connect self`
 * covers it whatever the country domain. Null when the request fails or does
 * not move. Each request writes one trace entry: which callback ended it, how
 * long it took and where it landed, since a page of results waits on the
 * slowest one.
 */
export function resolveRedirect(url: string, trace: Trace): Promise<string | null> {
  const { promise, resolve } = Promise.withResolvers<string | null>()
  if (typeof GM_xmlhttpRequest !== 'function') {
    resolve(null)
    return promise
  }
  const started = Date.now()
  // Headers end the request with an abort, whose callback then comes too.
  let settled = false
  const settle = (how: string, target: string | null, status?: number): void => {
    if (settled) return
    settled = true
    window.clearTimeout(deadline)
    trace('redirect', `${how} after ${Date.now() - started} ms, status ${status ?? '-'} → ${target ? new URL(target).host : 'nowhere'}`)
    resolve(target)
  }
  const targetOf = (response: GmResponseEvent<'text'>): string | null => {
    const moved = response.finalUrl === url ? null : response.finalUrl
    return locationOf(response.responseHeaders, url) ?? moved
  }
  // `redirect` puts Tampermonkey in fetch mode, where Chrome ignores the request's own `timeout`.
  const deadline = window.setTimeout(() => {
    settle('timeout', null)
    request.abort()
  }, RESOLVE_TIMEOUT_MS)
  const request = GM_xmlhttpRequest({
    url,
    method: 'GET',
    redirect: 'manual',
    onreadystatechange: (response) => {
      if (response.readyState < XMLHttpRequest.HEADERS_RECEIVED) return
      settle('headers', targetOf(response), response.status)
      request.abort()
    },
    onload: (response) => settle('load', targetOf(response), response.status),
    onerror: (response) => settle('error', null, response.status),
    onabort: () => settle('abort', null),
  })
  return promise
}
