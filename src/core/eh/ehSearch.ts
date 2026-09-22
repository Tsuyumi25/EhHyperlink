import { cacheGet, cacheSet } from './cache'
import { readCategory } from './category'
import { galleryRef, pageCount } from './ehUrl'
import type { SearchRequest } from './requestLog'
import { searchThrottle } from './throttle'

export interface SearchHit {
  gid: number
  token: string
  href: string
  title: string
  /** filled from the metadata API when available; search rows show one title field only */
  titleJpn: string
  category: string
  tags: string[]
  pages: number | null
  /** unix seconds; read from the row's date cell and replaced by the exact API value */
  posted: number | null
  /**
   * Cover URL and 0–5 rating, from the metadata API only. A search row's
   * thumbnail is a lazy-load placeholder until it scrolls into view, and its
   * rating is a sprite offset in a `background-position`; the API hands over
   * both as plain values.
   */
  thumb: string
  rating: number | null
  torrentHref: string | null
}

/** One search page: the request that fetched it, the rows it held, and when they were read. */
export interface SearchResponse {
  request: SearchRequest
  hits: SearchHit[]
  /** unix ms of the response, from the cache entry when it came from there */
  at: number
}

export type SearchVisibility = 'published' | 'expunged'

/** `f_cats=0` 避免沿用帳號隱藏的分類；搜尋領域也納入 URL 快取鍵。 */
export function searchUrl(origin: string, query: string, visibility: SearchVisibility = 'published'): string {
  const expunged = visibility === 'expunged' ? '&f_sh=on' : ''
  return `${origin}/?f_cats=0${expunged}&f_search=${encodeURIComponent(query)}`
}

/**
 * `2023-11-19 02:18` out of the row's date cell. The host prints it in whatever
 * timezone the account is set to, which is enough to order one result page; the
 * metadata API replaces it with the exact unix value.
 */
function postedSeconds(cell: Element | null): number | null {
  const text = cell?.textContent?.trim()
  if (!text) return null
  const parsed = Date.parse(`${text.replace(' ', 'T')}Z`)
  return Number.isFinite(parsed) ? Math.round(parsed / 1000) : null
}

/** Parse one result page in any of the five EH list modes (Minimal, Minimal+, Compact, Extended, Thumbnail). */
export function parseSearchResults(html: string): SearchHit[] {
  const root = new DOMParser().parseFromString(html, 'text/html')
  const rows = root.querySelectorAll<HTMLElement>('.itg > tbody > tr, .itg > tr, .itg .gl1t')
  const hits: SearchHit[] = []
  for (const row of rows) {
    const titleElement = row.querySelector('.glink')
    if (!titleElement) continue
    const link = row.querySelector<HTMLAnchorElement>('.glname a, .gl1e a, .gl2e a, .gl1t > a, a[href*="/g/"]')
    const href = link?.getAttribute('href') ?? ''
    const ref = galleryRef(href)
    if (ref === null) continue
    const pages =
      [...row.querySelectorAll('div')]
        .filter((element) => element.children.length === 0)
        .map((element) => pageCount(element.textContent ?? ''))
        .find((count) => count !== null) ?? null
    const torrent = row.querySelector<HTMLAnchorElement>('.gldown a')
    hits.push({
      gid: ref.gid,
      token: ref.token,
      href,
      title: titleElement.textContent?.trim() ?? '',
      titleJpn: '',
      category: readCategory(row.querySelector('.cn, .cs')),
      tags: [...row.querySelectorAll('.gt, .gtl')].map((element) => element.getAttribute('title') ?? '').filter(Boolean),
      pages,
      posted: postedSeconds(row.querySelector(`#posted_${ref.gid}, #postedpop_${ref.gid}`)),
      thumb: '',
      rating: null,
      torrentHref: torrent?.getAttribute('href') ?? null,
    })
  }
  return hits
}

/**
 * One search page, from the cache when it is there. The pace is held only for
 * requests that actually leave, so a cached page costs no time at all.
 *
 * `force` skips the read and overwrites the entry — the refetch button asks for
 * that, and nothing else should.
 */
export async function fetchSearch(origin: string, query: string, visibility: SearchVisibility = 'published', force = false): Promise<SearchResponse> {
  const url = searchUrl(origin, query, visibility)
  const cached = force ? null : await cacheGet<SearchHit[]>(url)
  if (cached) return { request: { kind: 'search', url, term: query, cached: true }, hits: cached.data, at: cached.at }
  await searchThrottle.next()
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`search failed: HTTP ${response.status}`)
  const hits = parseSearchResults(await response.text())
  await cacheSet(url, hits)
  return { request: { kind: 'search', url, term: query }, hits, at: Date.now() }
}
