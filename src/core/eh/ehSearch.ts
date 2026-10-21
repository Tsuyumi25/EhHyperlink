import { cacheGet, cacheSet } from './cache'
import { readCategory } from './category'
import { galleryRef, pageCount } from './ehUrl'
import type { SearchRequest } from './requestLog'
import { searchThrottle } from './throttle'
import { request, RequestError } from './request'
import { isGalleryId, isNullableNumber, isNullableRating, isNullableString, isRating, isRecord, isStrings } from './validation'

export interface SearchHit {
  gid: number
  token: string
  href: string
  title: string
  /** Search pages expose only the displayed title; no second title is fetched. */
  titleJpn: string
  category: string
  tags: string[]
  pages: number | null
  /** Listed wall time, interpreted as UTC for ordering; the page omits the account's timezone. */
  posted: number | null
  thumb: string
  /** Displayed half-star rating, or null when unrated; no precise API score is fetched. */
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

/** Languages excluded in the account's EH settings: `account` lets EH drop them, `all` lists them anyway. */
export type LanguageScope = 'all' | 'account'

/**
 * Extended supplies the full tag list. `f_cats=0`, `f_sfu` and `f_sft` turn off the account's
 * category, uploader and My Tags filters: a relative is worth showing even when the user hid its
 * kind, because they opened a gallery of that kind to get here. Excluded languages stay a
 * setting (`f_sfl`) — other-language editions are what the badges exist for, yet a reader may
 * still not want languages they cannot read.
 */
export function searchUrl(origin: string, query: string, visibility: SearchVisibility = 'published', languages: LanguageScope = 'account'): string {
  const expunged = visibility === 'expunged' ? '&f_sh=on' : ''
  const everyLanguage = languages === 'all' ? '&f_sfl=on' : ''
  return `${origin}/?f_cats=0&inline_set=dm_e${expunged}&f_sfu=on&f_sft=on${everyLanguage}&f_search=${encodeURIComponent(query)}`
}

/** The account's wall time preserves ordering within the fetched search pages. */
function postedSeconds(cell: Element | null): number | null {
  const text = cell?.textContent?.trim()
  if (!text) return null
  const parsed = Date.parse(`${text.replace(' ', 'T')}Z`)
  return Number.isFinite(parsed) ? Math.round(parsed / 1000) : null
}

// Native stars advance 16px horizontally; the -21px sprite row removes half a star.
function listedRating(row: Element): number | null {
  const stars = row.querySelector<HTMLElement>('.ir')
  if (!stars) return null
  const [left, top] = stars.style.backgroundPosition.split(' ')
  if (!left?.endsWith('px')) return null
  const x = Number.parseFloat(left)
  if (x > 0) return null
  if (x % 16 !== 0) return null
  let rating = 5 + x / 16
  switch (top) {
    case '-1px': break
    case '-21px': rating -= 0.5; break
    default: return null
  }
  return isRating(rating) ? rating : null
}

function isSearchHit(value: unknown): value is SearchHit {
  if (!isRecord(value)) return false
  if (!isGalleryId(value.gid)) return false
  for (const field of ['token', 'href', 'title', 'titleJpn', 'category', 'thumb']) {
    if (typeof value[field] !== 'string') return false
  }
  if (!isStrings(value.tags)) return false
  if (!isNullableNumber(value.pages)) return false
  if (!isNullableNumber(value.posted)) return false
  if (!isNullableRating(value.rating)) return false
  return isNullableString(value.torrentHref)
}

function isSearchHits(value: unknown): value is SearchHit[] {
  return Array.isArray(value) && value.every(isSearchHit)
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
    const cover = row.querySelector<HTMLImageElement>('.gl1e img, .glthumb img, .gl3t img')
    hits.push({
      gid: ref.gid,
      token: ref.token,
      href,
      title: titleElement.textContent?.trim() ?? '',
      titleJpn: '',
      category: readCategory(row.querySelector('.cn, .cs')),
      tags: [...row.querySelectorAll('.gt, .gtl, .gtw')].map((element) => element.getAttribute('title') ?? '').filter(Boolean),
      pages,
      posted: postedSeconds(row.querySelector(`#posted_${ref.gid}, #postedpop_${ref.gid}`)),
      thumb: cover?.getAttribute('data-src') || cover?.getAttribute('src') || '',
      rating: listedRating(row),
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
export async function fetchSearch(origin: string, query: string, visibility: SearchVisibility = 'published', languages: LanguageScope = 'account', force = false): Promise<SearchResponse> {
  const url = searchUrl(origin, query, visibility, languages)
  const cached = force ? null : await cacheGet(url, isSearchHits)
  if (cached) return { request: { kind: 'search', url, term: query, hitCount: cached.data.length, cached: true, attempts: 0 }, hits: cached.data, at: cached.at }
  try {
    const response = await request(url, { credentials: 'same-origin' }, searchThrottle, async (response) => parseSearchResults(await response.text()))
    await cacheSet(url, response.data)
    return { request: { kind: 'search', url, term: query, hitCount: response.data.length, attempts: response.attempts }, hits: response.data, at: Date.now() }
  } catch (error) {
    if (!(error instanceof RequestError)) throw error
    return { request: { kind: 'search', url, term: query, hitCount: null, attempts: error.attempts, error }, hits: [], at: Date.now() }
  }
}
