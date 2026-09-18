import { readWorkText } from '../title/chapter'
import { type ContainerPlan, planContainerSearch } from './container'
import type { SourceGallery } from '../eh/galleryPage'
import { compile, letter } from '../title/pattern'
import { analyzeTitle } from '../title/titleStructure'

export interface SearchPlan extends ContainerPlan {
  /** quoted-phrase terms that retrieve other editions and chapters of the same work */
  editionTerms: string[]
  /** creator clause appended to every phrase search; empty when the gallery carries no creator tag */
  scope: string
}

/** `artist:` / `group:` tag namespace → EH search prefix. */
const CREATOR_SCOPES: Record<string, string> = { artist: 'a', group: 'g' }

/**
 * `a:"x$"` for one creator, `~a:"x$" ~g:"y$"` for several (EH rejects a lone `~`).
 * Same-book editions share at least one creator tag with the source in 97.7% of
 * TranslatedJump pairs; 1.7% of candidates carry no creator tag at all and are
 * the price of narrowing a common phrase to one result page.
 */
export function creatorScope(tags: readonly string[]): string {
  const clauses: string[] = []
  for (const tag of tags) {
    const colon = tag.indexOf(':')
    const prefix = CREATOR_SCOPES[tag.slice(0, colon)]
    if (prefix) clauses.push(`${prefix}:"${tag.slice(colon + 1).replaceAll('_', ' ')}$"`)
  }
  if (clauses.length <= 1) return clauses.join('')
  return clauses.map((clause) => `~${clause}`).join(' ')
}

const LETTER_RE = compile(letter)
/** ehwiki: a translated title follows the original after a spaced vertical bar. */
export const TITLE_BAR = ' | '

/**
 * Search phrases for one run of top-level text: each side of a vertical bar, cut
 * at its chapter marker, letters required.
 */
export function editionTermsOf(coreSegment: string): string[] {
  return coreSegment
    .split(TITLE_BAR)
    .map((part) => readWorkText(part).phrase)
    .filter((part) => LETTER_RE.test(part))
}

/** Editions are searched by the unwrapped work text of each title field; Manga adds the container plan. */
export function planSearch(source: SourceGallery): SearchPlan {
  const editionTerms: string[] = []
  for (const value of [source.title, source.titleJpn]) {
    if (!value) continue
    for (const segment of analyzeTitle(value).coreSegments) {
      for (const term of editionTermsOf(segment)) {
        if (!editionTerms.includes(term)) editionTerms.push(term)
      }
    }
  }
  return { editionTerms, scope: creatorScope(source.tags), ...planContainerSearch(source, (text) => LETTER_RE.test(text), editionTerms) }
}
