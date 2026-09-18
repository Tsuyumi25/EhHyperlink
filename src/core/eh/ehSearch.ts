import { readCategory } from './category'
import { galleryRef, pageCount } from './ehUrl'
import type { SearchRequest } from './requestLog'

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
  torrentHref: string | null
}

/** One search page: the request that fetched it, and the rows it held. */
export interface SearchResponse {
  request: SearchRequest
  hits: SearchHit[]
}

/**
 * One request's query: one work phrase, qualified, plus the creator scope.
 *
 * `title:` earns its place twice. A bare phrase is matched against tags as well
 * as titles (ehwiki `Gallery_Searching`), and a work phrase that happens to
 * equal a popular tag then fills the 25-row first page with unrelated galleries
 * — corpus run: 4.4% of phrases collide with a tag value, and qualifying them
 * puts 16.5% more real hits back on the first page.
 *
 * One phrase per request, always. `~` reads as OR for tag terms only: mixed into
 * a tag OR group EH rejects the query outright, and `~title:"a" ~title:"b"` is
 * accepted yet behaves as AND. Measured live: `title:"a"` alone returned 11
 * galleries, `title:"b"` 4, `title:"c"` 1, and `~title:"a" ~title:"b"
 * ~title:"c"` returned that same 1 — the intersection, not the union. Riding
 * phrases together would therefore drop 35.3% of the editions and series this
 * finds and leave 13.8% of galleries with nothing at all.
 */
export function searchUrl(origin: string, term: string, scope = ''): string {
  const query = scope ? `title:"${term}" ${scope}` : `title:"${term}"`
  return `${origin}/?f_search=${encodeURIComponent(query)}`
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
      torrentHref: torrent?.getAttribute('href') ?? null,
    })
  }
  return hits
}

export async function fetchSearch(origin: string, term: string, scope = ''): Promise<SearchResponse> {
  const url = searchUrl(origin, term, scope)
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`search failed: HTTP ${response.status}`)
  return { request: { kind: 'search', url, term }, hits: parseSearchResults(await response.text()) }
}
