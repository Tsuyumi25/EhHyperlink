import { GM_xmlhttpRequest } from '$'

/** A redirect that has not answered by now leaves the result on its original link. */
const RESOLVE_TIMEOUT_MS = 8_000

/**
 * Where `url` redirects to, read from the userscript manager's `finalUrl`
 * once the response headers arrive; the request is then aborted, so the
 * target's page is never downloaded. A same-page fetch cannot do this: the
 * redirect leaves the origin and CORS hides where it went. Called from the
 * page that owns `url`, so `@connect self` covers it whatever the country
 * domain. Null when the request fails or does not move.
 */
export function resolveRedirect(url: string): Promise<string | null> {
  const { promise, resolve } = Promise.withResolvers<string | null>()
  if (typeof GM_xmlhttpRequest !== 'function') {
    resolve(null)
    return promise
  }
  const settle = (finalUrl: string | undefined): void => resolve(finalUrl && finalUrl !== url ? finalUrl : null)
  const request = GM_xmlhttpRequest({
    url,
    method: 'GET',
    timeout: RESOLVE_TIMEOUT_MS,
    onreadystatechange: (response) => {
      if (response.readyState < XMLHttpRequest.HEADERS_RECEIVED) return
      settle(response.finalUrl)
      request.abort()
    },
    onload: (response) => settle(response.finalUrl),
    onerror: () => resolve(null),
    ontimeout: () => resolve(null),
    onabort: () => resolve(null),
  })
  return promise
}
