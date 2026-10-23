/** One organic result as Google lays it out: what the reader would see on the page. */
export interface GoogleResult {
  title: string
  /**
   * The link as Google writes it. Since 2026 that is `https://www.google.com/goto?url=<token>`:
   * the target is not in the page at all (not in `href`, not in `ping`), but
   * the token redirects to it when opened, from any tab.
   */
  href: string
  /** Google's breadcrumb of the target (`https://site.example › users`), the only readable trace of where it goes */
  cite: string
  snippet: string
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

/** The organic results on a Google search page, in page order. */
export function readGoogleResults(root: ParentNode): GoogleResult[] {
  const results: GoogleResult[] = []
  for (const heading of root.querySelectorAll('#search a h3')) {
    const link = heading.closest('a')
    if (!link) continue
    const block = resultBlock(link)
    const title = (heading.textContent ?? '').trim()
    const cite = (block.querySelector('cite')?.textContent ?? '').trim()
    results.push({ title, href: link.href, cite, snippet: snippetOf(block, title, cite) })
  }
  return results
}
