import type { PreviewAnswer, PreviewResult, SearchOnPage } from './preview'

const ORIGIN = 'https://www.pixiv.net'

type PixivSearch = { kind: 'artworks'; word: string; page: number; url: URL } | { kind: 'users'; word: string; page: number; url: URL }

/** pixiv serves its pages under `/en/` too for English readers; the search is the same. */
function pathOf(url: URL): string {
  return url.pathname.startsWith('/en/') ? url.pathname.slice(3) : url.pathname
}

function pageOf(url: URL): number {
  const page = Number(url.searchParams.get('p') ?? '1')
  return Number.isInteger(page) && page >= 1 ? page : 1
}

/** The artwork search (`/search?q=`) or the user search (`/search/users?nick=`) a pixiv page shows. */
function pixivSearch(url: URL): PixivSearch | null {
  if (url.origin !== ORIGIN) return null
  const path = pathOf(url)
  const query = url.searchParams.get('q')
  if (path === '/search' && query) return { kind: 'artworks', word: query, page: pageOf(url), url }
  const nick = url.searchParams.get('nick')
  if (path === '/search/users' && nick) return { kind: 'users', word: nick, page: pageOf(url), url }
  return null
}

export function pixivSearchOf(url: URL): SearchOnPage | null {
  const search = pixivSearch(url)
  if (!search) return null
  return { key: `pixiv\u0000${search.kind}\u0000${search.word}\u0000${search.page}`, blocked: false }
}

/** Page `page` (0-based) of the search at `url`; pixiv counts pages from 1 in `p`. */
export function pixivPageUrl(url: string, page: number): string {
  const target = new URL(url)
  if (page > 0) target.searchParams.set('p', String(page + 1))
  else target.searchParams.delete('p')
  return target.href
}

/**
 * The page's `s_mode` as the search API names it: the URL and the API spell
 * the same modes differently (`tag_tc` on the page, `s_tag_tc` in the API).
 * Mapping as ppixiv's search data source does it (2026-10).
 */
const API_SEARCH_MODE: Record<string, string> = {
  tag: 's_tag',
  tag_full: 's_tag_full',
  tc: 's_tc',
  tag_tc: 's_tag_tc',
}

/**
 * The JSON request behind a pixiv search page, sent from a pixiv tab so it
 * carries the reader's session. The page itself renders its results from the
 * same API with generated class names; reading the JSON is steadier than
 * reading that markup. Artworks: `/ajax/search/artworks/<word>`; users: the
 * mobile `/touch/ajax/search/users`, which ppixiv uses because the desktop
 * user search has no API of its own.
 */
export function pixivApiUrl(url: URL): string | null {
  const search = pixivSearch(url)
  if (!search) return null
  if (search.kind === 'users') {
    const params = new URLSearchParams({ nick: search.word, s_mode: 's_usr', p: String(search.page), lang: 'ja' })
    return `${ORIGIN}/touch/ajax/search/users?${params}`
  }
  const params = new URLSearchParams({
    word: search.word,
    order: 'date_d',
    mode: 'all',
    p: String(search.page),
    s_mode: API_SEARCH_MODE[url.searchParams.get('s_mode') ?? ''] ?? 's_tag',
    lang: 'ja',
  })
  return `${ORIGIN}/ajax/search/artworks/${encodeURIComponent(search.word)}?${params}`
}

interface ArtworkJson {
  id?: string
  title?: string
  userName?: string
  createDate?: string
}

interface UserJson {
  user_id?: string
  user_name?: string
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

/**
 * Results out of the search API's JSON. Artworks sit in
 * `body.illustManga.data`, where ad slots appear as entries without an `id`;
 * users in `body.users`. `error: true` is pixiv refusing the request, which
 * reads as unreadable rather than as no results.
 */
export function readPixivResults(json: unknown, url: URL): PreviewAnswer {
  const root = record(json)
  if (root.error !== false) return { status: 'unreadable', results: [] }
  const body = record(root.body)
  const kind = pixivSearch(url)?.kind
  const results: PreviewResult[] = []
  if (kind === 'users') {
    const users = Array.isArray(body.users) ? (body.users as UserJson[]) : []
    for (const user of users) {
      if (!user.user_id) continue
      results.push({ title: user.user_name ?? user.user_id, href: `${ORIGIN}/users/${user.user_id}`, origin: ORIGIN, byline: '', snippet: '' })
    }
  } else {
    const data = record(body.illustManga).data
    const artworks = Array.isArray(data) ? (data as ArtworkJson[]) : []
    for (const artwork of artworks) {
      if (!artwork.id) continue
      results.push({
        title: artwork.title ?? artwork.id,
        href: `${ORIGIN}/artworks/${artwork.id}`,
        origin: ORIGIN,
        byline: artwork.userName ?? '',
        snippet: (artwork.createDate ?? '').slice(0, 10),
      })
    }
  }
  return { status: results.length > 0 ? 'ok' : 'empty', results }
}
