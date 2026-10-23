import type { SourceGallery } from '../eh/galleryPage'
import { analyzeTitle, parseTitleSegments } from '../title/titleStructure'

/** What a search term names: the work is what stores sell, circle and artist are who to follow. */
export type TermKind = 'work' | 'circle' | 'artist'

export interface SearchTerm {
  kind: TermKind
  text: string
}

/**
 * The Japanese title first: every store searched here lists works under
 * their original name, and the romanized field is EH's own transliteration.
 */
function originalTitle(source: SourceGallery): string {
  return source.titleJpn || source.title
}

/**
 * ehwiki writes the creator block as `Circle (Artist)`: the text outside the
 * nested parentheses is the circle, each nested block one artist line. A block
 * without nesting names one creator whose role the title does not say; it is
 * offered as a circle, the role most leading blocks carry.
 */
function creatorTerms(block: string): SearchTerm[] {
  const segments = parseTitleSegments(block)
  if (segments === null) return [{ kind: 'circle', text: block.trim() }]
  const terms: SearchTerm[] = []
  const circle = segments
    .filter((segment) => segment.kind === 'text')
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .join(' ')
  if (circle) terms.push({ kind: 'circle', text: circle })
  const artists = segments
    .filter((segment) => segment.kind === 'block')
    .map((segment) => segment.text.trim())
    .filter(Boolean)
  for (const text of artists) terms.push({ kind: 'artist', text })
  return terms
}

/** `artist:some_name` → `some name`, as EH writes tag ids with underscores for spaces. */
function tagTerms(tags: readonly string[]): SearchTerm[] {
  const terms: SearchTerm[] = []
  for (const tag of tags) {
    const [namespace, ...rest] = tag.split(':')
    const text = rest.join(':').replaceAll('_', ' ').trim()
    if (!text) continue
    if (namespace === 'group') terms.push({ kind: 'circle', text })
    if (namespace === 'artist') terms.push({ kind: 'artist', text })
  }
  return terms
}

function termKey(term: SearchTerm): string {
  return `${term.kind}\u0000${term.text.normalize('NFKC').toLowerCase()}`
}

/**
 * Starting terms for a source search, read off the gallery. They are a draft for
 * the reader to edit, never a verdict: the creator tags only fill in when the
 * title carries no creator block, since a tag is the romanized form and the
 * stores index the original.
 */
export function searchTerms(source: SourceGallery): SearchTerm[] {
  const parts = analyzeTitle(originalTitle(source))
  const terms: SearchTerm[] = parts.coreSegments.map((text) => ({ kind: 'work', text }))
  const creators = parts.identityBlocks.flatMap(creatorTerms)
  terms.push(...(creators.length > 0 ? creators : tagTerms(source.tags)))

  const seen = new Set<string>()
  return terms.filter((term) => {
    const key = termKey(term)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * The title as one Google search: the creator block and the work as the title
 * writes them, without what sits around them — a leading event or other
 * marker, a trailing language, translation or release tag, or the series
 * block after the work. Those vary between uploads of one book, while
 * `[Circle (Artist)] Work` is what a store page or a post about it repeats.
 */
export function googleQuery(source: SourceGallery): string {
  const parts = analyzeTitle(originalTitle(source))
  const creator = parts.identityBlocks.map((block) => `[${block}]`)
  return [...creator, ...parts.coreSegments].join(' ')
}
