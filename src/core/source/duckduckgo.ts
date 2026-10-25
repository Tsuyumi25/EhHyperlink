import { whitespaceRun } from '../title/pattern'
import type { PreviewResult, SearchOnPage } from './preview'

/**
 * DuckDuckGo's HTML-only search: the results are in the HTML the server sends,
 * with plain class names, and each link carries its target in `uddg` (observed
 * 2026-10). `kp=-2` turns safe search off; the default hides most of what a
 * gallery's title finds.
 */
const ORIGIN = 'https://html.duckduckgo.com'
const PATH = '/html/'
const SAFE_SEARCH_OFF = '-2'

/**
 * The page of a search this tab is to read. DuckDuckGo pages only by posting
 * its "Next" form, whose token comes with the page before, so a later page has
 * no URL of its own; the tab opens the first page and posts its way on.
 * DuckDuckGo leaves the field alone (observed 2026-10).
 */
const PAGE_FIELD = 'ehl-page'

export function duckDuckGoSearchUrl(query: string): string {
  const url = new URL(PATH, ORIGIN)
  url.searchParams.set('q', query)
  url.searchParams.set('kp', SAFE_SEARCH_OFF)
  return url.href
}

/** Which page (0-based) the tab at `url` is to read. */
export function duckDuckGoPageOf(url: URL): number {
  return Number(url.searchParams.get(PAGE_FIELD) ?? 0)
}

export function duckDuckGoSearchOf(url: URL): SearchOnPage | null {
  const query = url.searchParams.get('q')
  if (url.origin !== ORIGIN || url.pathname !== PATH || query === null) return null
  return { key: `duckduckgo\u0000${query}\u0000${duckDuckGoPageOf(url)}`, blocked: false }
}

export function duckDuckGoPageUrl(url: string, page: number): string {
  const target = new URL(url)
  if (page > 0) target.searchParams.set(PAGE_FIELD, String(page))
  else target.searchParams.delete(PAGE_FIELD)
  return target.href
}

function text(element: Element | null): string {
  return (element?.textContent ?? '').replace(whitespaceRun, ' ').trim()
}

/** `//duckduckgo.com/l/?uddg=<target>&rut=…` → the target; any other link as it is. */
function targetOf(href: string): string {
  const url = new URL(href, ORIGIN)
  return url.searchParams.get('uddg') ?? url.href
}

function originOf(href: string): string | null {
  try {
    return new URL(href).origin
  } catch {
    return null
  }
}

/** The page's "Next" form, absent on the last page. */
export function duckDuckGoNextForm(root: ParentNode): HTMLFormElement | null {
  return root.querySelector('input[type="submit"][value="Next"]')?.closest('form') ?? null
}

/**
 * Whether the page is a result list at all: results, or the "No results found"
 * box (`.result--no-result`). Anything else — a bot check — has neither.
 */
export function isDuckDuckGoResultPage(root: ParentNode): boolean {
  return root.querySelector('.results .result') !== null
}

/**
 * The results on a DuckDuckGo HTML page, in page order. Observed markup
 * (2026-10): each `.result` holds `.result__a` (title and link),
 * `.result__url` (the address as shown), `.result__snippet`, and
 * `.result__icon__img`, the site icon served by DuckDuckGo itself.
 */
export function readDuckDuckGoResults(root: ParentNode): PreviewResult[] {
  const results: PreviewResult[] = []
  for (const block of root.querySelectorAll('.results .result:not(.result--no-result)')) {
    const link = block.querySelector('.result__a')
    const raw = link?.getAttribute('href')
    if (!link || !raw) continue
    const href = targetOf(raw)
    const icon = block.querySelector('.result__icon__img')?.getAttribute('src')
    results.push({
      title: text(link),
      href,
      origin: originOf(href),
      icon: icon ? new URL(icon, ORIGIN).href : null,
      byline: text(block.querySelector('.result__url')),
      snippet: text(block.querySelector('.result__snippet')),
      thumb: null,
      works: [],
    })
  }
  return results
}
