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
 * `none` on DLsite's "no matching works" box, `missing` on its 404 page
 * (`.error_box`, "ページが見つかりませんでした"; observed 2026-10 for a page
 * past the last one), null while Vue is still filling the list in (the server
 * HTML carries an empty `#search_result_list`).
 */
export function dlsiteResultState(root: ParentNode): 'results' | 'none' | 'missing' | null {
  if (root.querySelector('li[data-list_item_product_id]')) return 'results'
  if (root.querySelector('.work_not_found')) return 'none'
  if (root.querySelector('.error_box')) return 'missing'
  return null
}

/**
 * Whether the search has a page after this one. The server renders the pager
 * (observed 2026-10): `.page_no` lists the pages with the current one as a
 * bare `<strong>`, and stays empty when everything fits on one page.
 */
export function dlsiteHasNextPage(root: ParentNode): boolean {
  const current = root.querySelector('.page_no li > strong')?.closest('li')
  return Boolean(current?.nextElementSibling?.querySelector('a'))
}

/** The image folder each id prefix sits in: doujin works under `doujin`, books (single chapters, volumes) under `books`. */
const IMAGE_FLOOR: Record<string, string> = {
  RJ: 'doujin',
  BJ: 'books',
}

/**
 * A work's cover thumbnail worked out from its id, for when the page does not
 * show it. The folder is the id rounded up to the next thousand (observed
 * 2026-10: `RJ01000001` in `RJ01001000`, `RJ286001` in `RJ287000`,
 * `BJ01000001` in `books/BJ01001000`); prefixes outside `IMAGE_FLOOR` get none.
 */
export function dlsiteThumb(id: string): string | null {
  const prefix = id.slice(0, 2)
  const digits = id.slice(2)
  const floor = IMAGE_FLOOR[prefix]
  if (!floor || !isDigits(digits)) return null
  const folder = String(Math.ceil(Number(digits) / 1000) * 1000).padStart(digits.length, '0')
  return `https://img.dlsite.jp/resize/images2/work/${floor}/${prefix}${folder}/${id}_img_main_240x240.jpg`
}

/**
 * The cover the rendered list shows: `.work_thumb img`, written
 * protocol-relative (`//img.dlsite.jp/…`). Before the reader confirms their
 * age it is a caution placeholder on the site's own host instead, which is not
 * the cover; only an image from the image host counts.
 */
function renderedThumb(item: Element): string | null {
  const src = item.querySelector('.work_thumb img')?.getAttribute('src') ?? ''
  const url = src.startsWith('//') ? `https:${src}` : src
  return url.startsWith('https://img.dlsite.jp/') ? url : null
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
    const id = item.getAttribute('data-list_item_product_id') ?? ''
    results.push({
      title: link.getAttribute('title') ?? text(link),
      href: link.href,
      origin: ORIGIN,
      icon: null,
      byline: [circle, authors.join('、')].filter(Boolean).join(' / '),
      snippet: [text(item.querySelector('.work_category a')), price ? `${price}円` : '', id].filter(Boolean).join(' · '),
      thumb: renderedThumb(item) ?? dlsiteThumb(id),
      works: [],
    })
  }
  return results
}
