import { readWorkText } from '../title/chapter'
import { ANTHOLOGY_TAG, type ContainerPlan, planContainerSearch } from './container'
import { fragmentsOf } from './fragment'
import type { SourceGallery } from '../eh/galleryPage'
import { compile, letter } from '../title/pattern'
import { analyzeTitle, TITLE_BAR } from '../title/titleStructure'

export interface SearchPlan extends ContainerPlan {
  /** quoted-phrase terms that retrieve other editions and chapters of the same work */
  editionTerms: string[]
  /** creator clause appended to every phrase search; empty when the gallery carries no creator tag */
  scope: string
  /**
   * True when `scope` names one creator and the terms are slices of this
   * gallery's own title. The host then returns that creator's own shelf filtered
   * by vocabulary the source itself uses, so a row needs no similarity of its
   * own to be worth showing — see `scoreEditions`.
   */
  fixedRange: boolean
}

/** `artist:` / `group:` tag namespace → EH search prefix. */
const CREATOR_SCOPES: Record<string, string> = { artist: 'a', group: 'g' }

function clauseOf(tag: string): string | null {
  const colon = tag.indexOf(':')
  const prefix = CREATOR_SCOPES[tag.slice(0, colon)]
  return prefix ? `${prefix}:"${tag.slice(colon + 1).replaceAll('_', ' ')}$"` : null
}

/**
 * The one creator whose shelf this gallery belongs on, or null.
 *
 * An artist wins over a group: the artist's range already holds the work they
 * published under that group, and the group's range holds other people's.
 * Census of 953,584 creator-tagged Doujinshi/Manga — one artist with a group
 * 51.2%, artist alone 38.2%, group alone 4.8%, so 94.2% land here.
 *
 * Two or more artists is a collaboration or an anthology (5.4%). That book sits
 * on nobody's shelf as its own entry, so there is no fixed range to narrow to
 * and the whole-phrase path keeps it.
 */
export function soleCreatorScope(tags: readonly string[]): string | null {
  const artists = tags.filter((tag) => tag.startsWith('artist:'))
  const groups = tags.filter((tag) => tag.startsWith('group:'))
  if (artists.length === 1) return clauseOf(artists[0])
  if (artists.length === 0 && groups.length === 1) return clauseOf(groups[0])
  return null
}

/**
 * `a:"x$"` for one creator, `~a:"x$" ~g:"y$"` for several (EH rejects a lone `~`).
 * Same-book editions share at least one creator tag with the source in 97.7% of
 * TranslatedJump pairs; 1.7% of candidates carry no creator tag at all and are
 * the price of narrowing a common phrase to one result page.
 */
export function creatorScope(tags: readonly string[]): string {
  const clauses = tags.map(clauseOf).filter((clause): clause is string => clause !== null)
  if (clauses.length <= 1) return clauses.join('')
  return clauses.map((clause) => `~${clause}`).join(' ')
}

const LETTER_RE = compile(letter)

/**
 * Search phrases for one run of top-level text: each side of a vertical bar,
 * cut at its chapter marker, letters required. An anthology keeps the marker —
 * see `planSearch`.
 */
export function editionTermsOf(coreSegment: string, keepCounter = false): string[] {
  return coreSegment
    .split(TITLE_BAR)
    .map((part) => (keepCounter ? part.trim() : readWorkText(part).phrase))
    .filter((part) => LETTER_RE.test(part))
}

/**
 * Work phrases of one title field, in written order, with whether its brackets
 * balanced. They do not for 0.6% of titles, and `analyzeTitle` then hands back
 * the whole raw string — circle name, language marker, translation group and
 * all. A whole-phrase search survives that; a two-character slice taken from it
 * searches for a fragment of the translation group's name.
 */
function fieldTerms(value: string, keepCounter: boolean): { terms: string[]; balanced: boolean } {
  const parts = analyzeTitle(value)
  const terms: string[] = []
  for (const segment of parts.coreSegments) {
    for (const term of editionTermsOf(segment, keepCounter)) {
      if (!terms.includes(term)) terms.push(term)
    }
  }
  return { terms, balanced: parts.balanced }
}

/**
 * Editions are searched by the unwrapped work text of each title field; Manga
 * adds the container plan.
 *
 * With one creator the scope already pins the search to that person's shelf, so
 * the phrases are cut down to two short slices (`fragment.ts`) and the run costs
 * two requests whatever the title looks like — against p50 2, p90 3, max 9 for
 * the whole-phrase path. Several creators keep the whole phrases, and so does an
 * anthology whatever its creator count: its phrase has to name one issue
 * exactly, so there is nothing to narrow and nothing to slice.
 *
 * One slice comes from each field. `titleJpn` is the original title, the same
 * string across every release, so it is where the left slice is cut; reading
 * the primary phrase off the merged list instead would pick a translated title
 * (`title` often carries one after a vertical bar, and a Chinese one is written
 * in han too), and slices cut from that only ever find one translation group's
 * uploads. The right slice comes from `title` because 8.4% of galleries leave
 * `titleJpn` blank and the romanisation is the only handle on those. Corpus run
 * over 1,121 sole-creator galleries: one slice per field loses something for
 * 1.2% of galleries against 10.2% when both slices come from the Japanese.
 *
 * Positions still divide the title — a romanisation transliterates in order —
 * so a chapter marker that survived filtering can only spoil one of the two.
 */
export function planSearch(source: SourceGallery): SearchPlan {
  // a chapter cut from an anthology names the issue verbatim — `(Work Beta -Gamma-
  // Vol. 24)`, counter and wrapper intact — so the phrase keeps its counter; cutting
  // it would retrieve every issue ever published and push this issue's own chapters
  // off the first page
  const anthology = source.tags.includes(ANTHOLOGY_TAG)
  const roman = source.title ? fieldTerms(source.title, anthology) : { terms: [], balanced: true }
  const japanese = source.titleJpn ? fieldTerms(source.titleJpn, anthology) : { terms: [], balanced: true }
  const phrases: string[] = []
  for (const term of [...roman.terms, ...japanese.terms]) {
    if (!phrases.includes(term)) phrases.push(term)
  }
  // an anthology's phrase already names one issue; slicing it would retrieve
  // the whole run of the magazine
  const sole = anthology ? null : soleCreatorScope(source.tags)
  const slices = sole ? sliceTerms(japanese, roman) : []
  // an unbalanced title leaves no phrase worth slicing; the whole-phrase path
  // still has the raw string to work with
  const editionTerms = slices.length > 0 ? slices : phrases
  // the container plan compares against whole phrases: a slice would never
  // match a segment, and every chapter term would be sent twice
  return {
    editionTerms,
    // an anthology's creator tags name everyone the issue collected, and a search
    // accepts five name + tag inclusions at most (ehwiki `Gallery_Searching`, Search
    // Limitations) — past that it returns nothing rather than narrowing further. The
    // issue name is exact enough to search on its own.
    scope: anthology ? '' : (sole ?? creatorScope(source.tags)),
    fixedRange: sole !== null && slices.length > 0,
    ...planContainerSearch(source, (text) => LETTER_RE.test(text), phrases),
  }
}

interface FieldTerms {
  terms: string[]
  balanced: boolean
}

/** Left slice of the original title, right slice of the romanisation. */
function sliceTerms(japanese: FieldTerms, roman: FieldTerms): string[] {
  const fromJpn = japanese.balanced ? fragmentsOf(japanese.terms[0] ?? '') : []
  const fromRoman = roman.balanced ? fragmentsOf(roman.terms[0] ?? '') : []
  const left = fromJpn[0]
  const right = fromRoman.at(-1)
  if (left === undefined) return fromRoman
  if (right === undefined) return fromJpn
  return [...new Set([left, right])]
}
