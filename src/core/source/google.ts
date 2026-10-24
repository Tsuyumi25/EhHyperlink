import { whitespaceRun } from '../title/pattern'
import type { PreviewResult, SearchOnPage } from './preview'

/** Google pages its results ten at a time through `start`. */
const RESULTS_PER_PAGE = 10

/** A plain Google search, page `page` (0-based) of its results. */
export function googleSearchUrl(query: string, page = 0): string {
  const start = page > 0 ? `&start=${page * RESULTS_PER_PAGE}` : ''
  return `https://www.google.com/search?q=${encodeURIComponent(query)}${start}`
}

/** Page `page` of the search at `url`. */
export function googlePageUrl(url: string, page: number): string {
  return googleSearchUrl(new URL(url).searchParams.get('q') ?? '', page)
}

function searchKey(url: URL): string | null {
  const query = url.searchParams.get('q')
  if (query === null) return null
  return `google\u0000${query}\u0000${url.searchParams.get('start') ?? '0'}`
}

/**
 * The search a Google page shows. On the "unusual traffic" page
 * (`/sorry/index`) the search waits in the `continue` URL, and the request is
 * answered as blocked instead of hanging until it times out.
 */
/** `www.google.com`, or a country domain it redirects to (seen: `www.google.com.hk`). */
function isGoogleHost(url: URL): boolean {
  return url.hostname.startsWith('www.google.')
}

export function googleSearchOf(url: URL): SearchOnPage | null {
  if (!isGoogleHost(url)) return null
  if (url.pathname.startsWith('/sorry')) {
    const next = url.searchParams.get('continue')
    if (!next) return null
    const key = searchKey(new URL(next))
    return key === null ? null : { key, blocked: true }
  }
  if (url.pathname !== '/search') return null
  const key = searchKey(url)
  return key === null ? null : { key, blocked: false }
}

/**
 * The block a result's title link sits in. Observed markup (2026-10): the
 * `<a>` wrapping an `<h3>` lives inside a `div[data-hveid]` that also holds the
 * `<cite>` breadcrumb and the snippet; class names are generated and change.
 */
function resultBlock(link: Element): Element {
  return link.closest('[data-hveid]') ?? link
}

/** The longest text in the block that is neither the title nor the breadcrumb: the snippet. */
function snippetOf(block: Element, title: string, cite: string): string {
  let best = ''
  for (const element of block.querySelectorAll('div, span')) {
    if (element.querySelector('h3, cite')) continue
    const text = (element.textContent ?? '').trim()
    if (text === title || text === cite) continue
    if (text.length > best.length) best = text
  }
  return best
}

/** The breadcrumb's leading URL, so the target's site can be shown before the link is followed. */
export function citeOrigin(cite: string): string | null {
  const [head] = cite.split(' ')
  try {
    return new URL(head).origin
  } catch {
    return null
  }
}

/** Whether the page holds the results area at all, results or none; null until it renders. */
export function googleResultsArea(root: ParentNode): Element | null {
  return root.querySelector('#search')
}

/**
 * The line Google prints under a title inside the link: the site's name and
 * the breadcrumb (`pixiv https://www.pixiv.net › users`), or for a post the
 * account, likes and age (`X · account · 7000+ likes · 3 months ago`). Read as
 * the link's text outside the title, one text node at a time, since the parts
 * sit in separate elements with no space between them.
 */
function siteLine(link: Element): string {
  const parts: string[] = []
  const walker = link.ownerDocument.createTreeWalker(link, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('h3')) continue
    parts.push(node.textContent ?? '')
  }
  return parts.join(' ').split(whitespaceRun).filter(Boolean).join(' ')
}

/**
 * The organic results on a Google search page, in page order. The link is
 * Google's own (`/goto?url=<token>` since 2026): the target is not in the page
 * at all — not in `href`, not in `ping` — but the token redirects to it with a
 * plain 302 on GET (HEAD answers 200 without moving), from any tab; the
 * reading tab swaps each for its target (`isGoogleRedirect`). Google draws each site's icon itself as a `data:` image
 * inside the link (observed 2026-10), which covers sites that keep no
 * `/favicon.ico`; the breadcrumb's origin is the fallback.
 */
export function isGoogleRedirect(href: string): boolean {
  return new URL(href).pathname === '/goto'
}

export function readGoogleResults(root: ParentNode): PreviewResult[] {
  const results: PreviewResult[] = []
  for (const heading of root.querySelectorAll('#search a h3')) {
    const link = heading.closest('a')
    if (!link) continue
    const block = resultBlock(link)
    const title = (heading.textContent ?? '').trim()
    const cite = (block.querySelector('cite')?.textContent ?? '').trim()
    results.push({
      title,
      href: link.href,
      origin: citeOrigin(cite),
      icon: link.querySelector('img')?.getAttribute('src') || null,
      byline: siteLine(link),
      snippet: snippetOf(block, title, cite),
      thumb: null,
      works: [],
    })
  }
  return results
}
