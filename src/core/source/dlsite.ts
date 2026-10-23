import { whitespaceRun } from '../title/pattern'
import type { PreviewResult, SearchOnPage } from './preview'

const ORIGIN = 'https://www.dlsite.com'

function isDigits(text: string | undefined): boolean {
  return text !== undefined && text !== '' && [...text].every((character) => character >= '0' && character <= '9')
}

/**
 * A search path and the page of it. DLsite pages a search with a trailing
 * `page/<n>/` segment (observed 2026-10: `…/fsr/=/keyword/<kw>/page/2/`);
 * page 1 has none.
 */
function splitPage(pathname: string): { base: string; page: number } {
  const parts = pathname.split('/')
  const at = parts.lastIndexOf('page')
  let page = 1
  if (isDigits(parts[at + 1])) {
    page = Number(parts[at + 1])
    parts.splice(at, 2)
  }
  const base = parts.join('/')
  return { base: base.endsWith('/') ? base : `${base}/`, page }
}

/** A DLsite floor search (`/<floor>/fsr/=/…`), the page the popup links to. */
function isDlsiteSearch(url: URL): boolean {
  const [, floor, section] = url.pathname.split('/')
  return url.origin === ORIGIN && Boolean(floor) && section === 'fsr'
}

export function dlsiteSearchOf(url: URL): SearchOnPage | null {
  if (!isDlsiteSearch(url)) return null
  const { base, page } = splitPage(url.pathname)
  return { key: `dlsite\u0000${base}\u0000${page}`, blocked: false }
}

/** Page `page` (0-based) of the search at `url`. */
export function dlsitePageUrl(url: string, page: number): string {
  const target = new URL(url)
  const { base } = splitPage(target.pathname)
  target.pathname = page > 0 ? `${base}page/${page + 1}/` : base
  return target.href
}

/**
 * Whether the search has rendered: `results` once the list items are in,
 * `none` on DLsite's "no matching works" box, null while Vue is still filling
 * the list in (the server HTML carries an empty `#search_result_list`).
 */
export function dlsiteResultState(root: ParentNode): 'results' | 'none' | null {
  if (root.querySelector('li[data-list_item_product_id]')) return 'results'
  if (root.querySelector('.work_not_found')) return 'none'
  return null
}

function text(element: Element | null): string {
  return (element?.textContent ?? '').replace(whitespaceRun, ' ').trim()
}

/**
 * Works on a DLsite search page, in page order. Observed markup (2026-10):
 * each work is an `li[data-list_item_product_id]` holding `.work_name a`, the
 * circle as `.maker_name > a`, its creators in `.author a`, the work type in
 * `.work_category a` and the price in `.work_price_base`.
 */
export function readDlsiteResults(root: ParentNode): PreviewResult[] {
  const results: PreviewResult[] = []
  for (const item of root.querySelectorAll('li[data-list_item_product_id]')) {
    const link = item.querySelector<HTMLAnchorElement>('.work_name a')
    if (!link) continue
    const circle = text(item.querySelector('.maker_name > a'))
    const authors = [...item.querySelectorAll('.author a')].map(text).filter(Boolean)
    const price = text(item.querySelector('.work_price_base'))
    results.push({
      title: link.getAttribute('title') ?? text(link),
      href: link.href,
      origin: ORIGIN,
      byline: [circle, authors.join('、')].filter(Boolean).join(' / '),
      snippet: [text(item.querySelector('.work_category a')), price ? `${price}円` : '', item.getAttribute('data-list_item_product_id') ?? '']
        .filter(Boolean)
        .join(' · '),
    })
  }
  return results
}
