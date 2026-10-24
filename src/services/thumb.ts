import { GM_xmlhttpRequest } from '$'

/**
 * Image hosts that refuse a request without their own site as the referrer:
 * i.pximg.net answers 403 to any other page (checked 2026-10). Their images
 * are fetched by the userscript manager with that referrer and shown from a
 * blob; every other host is loaded as a plain `<img>`.
 */
const REFERRER_BY_HOST: Record<string, string> = {
  'i.pximg.net': 'https://www.pixiv.net/',
}

const loaded = new Map<string, Promise<string | null>>()

function fetchWithReferrer(url: string, referrer: string): Promise<string | null> {
  const { promise, resolve } = Promise.withResolvers<string | null>()
  if (typeof GM_xmlhttpRequest !== 'function') {
    resolve(null)
    return promise
  }
  GM_xmlhttpRequest({
    url,
    method: 'GET',
    responseType: 'blob',
    headers: { Referer: referrer },
    onload: (response) => resolve(response.status === 200 ? URL.createObjectURL(response.response as Blob) : null),
    onerror: () => resolve(null),
    ontimeout: () => resolve(null),
  })
  return promise
}

/** An address the gallery page can show `url` from; null when the image cannot be had. */
export function thumbSource(url: string): Promise<string | null> {
  const known = loaded.get(url)
  if (known) return known
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    return Promise.resolve(null)
  }
  const referrer = REFERRER_BY_HOST[host]
  const source = referrer ? fetchWithReferrer(url, referrer) : Promise.resolve(url)
  loaded.set(url, source)
  return source
}
