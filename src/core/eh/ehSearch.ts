import { readCategory } from './category'
import { galleryRef, pageCount } from './ehUrl'

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

export function searchUrl(origin: string, term: string, scope = ''): string {
  const query = scope ? `"${term}" ${scope}` : `"${term}"`
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

export async function fetchSearch(origin: string, term: string, scope = ''): Promise<SearchHit[]> {
  const response = await fetch(searchUrl(origin, term, scope), { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`search failed: HTTP ${response.status}`)
  return parseSearchResults(await response.text())
}
