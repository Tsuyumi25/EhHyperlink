import type { SourceGallery } from '../eh/galleryPage'
import { duckDuckGoSearchUrl } from './duckduckgo'
import { googleSearchUrl } from './google'
import { SEARCH_SITES } from './sites'
import { googleQuery, searchTerms, type TermKind } from './terms'

const JP_SITES = 'site:*.jp'

export type RecipeSiteId = 'google' | 'googleJp' | 'duckduckgo' | 'dlsite' | 'pixiv'

/** One search the panel runs as soon as it opens. */
export interface RecipeSearch {
  site: RecipeSiteId
  /** what was searched: the whole title for Google, otherwise one term */
  kind: TermKind | 'title'
  text: string
  url: string
}

function siteUrl(id: RecipeSiteId, kind: TermKind, text: string): string {
  const site = SEARCH_SITES.find((candidate) => candidate.id === id)
  if (!site) throw new Error(`no search site ${id}`)
  return site.url({ kind, text })
}

/**
 * The searches for a gallery, in the order the panel shows them. Google takes
 * the whole title, creator block and work together, since a store page or a
 * post about the book repeats exactly that. DLsite takes each term on its
 * own: its keyword search misses a title glued to a circle name. pixiv takes
 * each term too, and its site table already sends a work to the artwork
 * search and a circle or artist to the user search.
 */
export function searchRecipe(source: SourceGallery): RecipeSearch[] {
  const searches: RecipeSearch[] = []
  const title = googleQuery(source)
  if (title) {
    searches.push({ site: 'google', kind: 'title', text: title, url: googleSearchUrl(title) })
    // The same search kept to `.jp` sites: Japanese shops, blogs and circle
    // pages instead of the overseas mirrors that fill the open search.
    // `lr=lang_ja` was tried and does the opposite (2026-10): mirrors pass as
    // Japanese pages, pixiv and X drop out.
    const jp = `${title} ${JP_SITES}`
    searches.push({ site: 'googleJp', kind: 'title', text: jp, url: googleSearchUrl(jp) })
    // A second engine with an index of its own, for what Google ranks low or leaves out.
    searches.push({ site: 'duckduckgo', kind: 'title', text: title, url: duckDuckGoSearchUrl(title) })
  }
  const terms = searchTerms(source)
  for (const site of ['dlsite', 'pixiv'] as const) {
    for (const term of terms) searches.push({ site, kind: term.kind, text: term.text, url: siteUrl(site, term.kind, term.text) })
  }
  const seen = new Set<string>()
  return searches.filter((search) => {
    if (seen.has(search.url)) return false
    seen.add(search.url)
    return true
  })
}
