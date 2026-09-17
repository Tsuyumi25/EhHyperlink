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
 * One request's query, from one or more work phrases and the creator scope.
 *
 * `title:` is required both ways. A bare phrase is matched against tags as well
 * as titles (ehwiki `Gallery_Searching`), and a work phrase that happens to equal
 * a popular tag then fills the 25-row first page with unrelated galleries —
 * corpus run: 4.4% of phrases collide with a tag value, and qualifying them puts
 * 16.5% more real hits back on the first page. `~` also rejects bare phrases
 * ("There are no matching tags for your OR terms").
 *
 * Several phrases become one OR group. `queryGroups` decides when that is
 * allowed; the caller MUST pass a non-empty group.
 */
export function searchUrl(origin: string, terms: readonly string[], scope = ''): string {
  const phrases = terms.length > 1 ? terms.map((term) => `~title:"${term}"`).join(' ') : `title:"${terms[0]}"`
  const query = scope ? `${phrases} ${scope}` : phrases
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

export async function fetchSearch(origin: string, terms: readonly string[], scope = ''): Promise<SearchResponse> {
  const url = searchUrl(origin, terms, scope)
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`search failed: HTTP ${response.status}`)
  return { request: { kind: 'search', url, terms: [...terms] }, hits: parseSearchResults(await response.text()) }
}
