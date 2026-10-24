import type { SourceGallery } from '../eh/galleryPage'
import { ANTHOLOGY_TAG } from '../search/container'
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

/** Separators between several artists written in one nested block (`Circle (A, B)`, `サークル (甲、乙)`). */
const ARTIST_SEPARATORS = [',', '、']

function splitArtists(text: string): string[] {
  let parts = [text]
  for (const separator of ARTIST_SEPARATORS) parts = parts.flatMap((part) => part.split(separator))
  return parts.map((part) => part.trim()).filter(Boolean)
}

/**
 * ehwiki writes the creator block as `Circle (Artist)`: the text outside the
 * nested parentheses is the circle, each nested block one or more artists,
 * several of them separated by commas. A block without nesting names one
 * creator whose role the title does not say; it is offered as a circle, the
 * role most leading blocks carry.
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
  const artists = segments.filter((segment) => segment.kind === 'block').flatMap((segment) => splitArtists(segment.text))
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
 * A run of work text shorter than this is not searched on its own: a title
 * split by a quoted word (`作品甲「超」作品乙`) leaves a one- or two-character
 * piece that every store and pixiv match by the thousand, none of them this
 * book. Creator names are searched whatever their length.
 */
const MIN_WORK_CHARACTERS = 3

function isSearchableWork(text: string): boolean {
  return [...text].length >= MIN_WORK_CHARACTERS
}

/**
 * Starting terms for a source search, read off the gallery. They are a draft for
 * the reader to edit, never a verdict: the creator tags only fill in when the
 * title carries no creator block, since a tag is the romanized form and the
 * stores index the original.
 */
export function searchTerms(source: SourceGallery): SearchTerm[] {
  const parts = analyzeTitle(originalTitle(source))
  const terms: SearchTerm[] = parts.coreSegments.filter(isSearchableWork).map((text) => ({ kind: 'work', text }))
  const creators = parts.identityBlocks.flatMap(creatorTerms)
  terms.push(...(creators.length > 0 ? creators : tagTerms(source.tags)))

  const seen = new Set<string>()
  const unique = terms.filter((term) => {
    const key = termKey(term)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return hasManyArtists(source, unique) ? unique.filter((term) => term.kind !== 'artist') : unique
}

/** More artists than this, and each artist search turns up their own work rather than this book. */
const MAX_ARTISTS = 3

/**
 * An anthology, or a book by more than `MAX_ARTISTS` artists counted from
 * the title or the artist tags: its artists are searched by the circle or the
 * work instead of one by one.
 */
function hasManyArtists(source: SourceGallery, terms: readonly SearchTerm[]): boolean {
  if (source.tags.includes(ANTHOLOGY_TAG)) return true
  const fromTitle = terms.filter((term) => term.kind === 'artist').length
  const fromTags = source.tags.filter((tag) => tag.startsWith('artist:')).length
  return Math.max(fromTitle, fromTags) > MAX_ARTISTS
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
