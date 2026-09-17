import { stripChapterMarkers } from '../title/chapter'
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

/**
 * Requests needed for a set of work phrases. EH has exactly one OR group per
 * query and every member must share a qualifier, so phrases can ride together
 * only while the creator scope leaves that group free — that is, with a single
 * creator tag. With several the scope is already `~a:"x$" ~g:"y$"`, and mixing
 * in a phrase (`~a:"x$" ~title:"…"`) is rejected outright as unsupported
 * syntax, so each phrase needs its own request.
 *
 * Corpus: 46.0% of visible galleries carry both title fields and 84.9% of those
 * yield two different phrases; half of them name one creator, so riding together
 * drops a request for 19.7% of galleries.
 */
export function queryGroups(terms: readonly string[], scope: string): string[][] {
  if (terms.length < 2 || scope.includes('~')) return terms.map((term) => [term])
  return [[...terms]]
}

const LETTER_RE = compile(letter)
/** ehwiki: a translated title follows the original after a spaced vertical bar. */
export const TITLE_BAR = ' | '

/** Search phrases for one title field: each side of a vertical bar, minus chapter markers, letters required. */
export function editionTermsOf(coreText: string): string[] {
  return coreText
    .split(TITLE_BAR)
    .map((part) => stripChapterMarkers(part))
    .filter((part) => LETTER_RE.test(part))
}

/** Editions are searched by the unwrapped work text of each title field; Manga adds the container plan. */
export function planSearch(source: SourceGallery): SearchPlan {
  const editionTerms: string[] = []
  for (const value of [source.title, source.titleJpn]) {
    if (!value) continue
    for (const term of editionTermsOf(analyzeTitle(value).coreText)) {
      if (!editionTerms.includes(term)) editionTerms.push(term)
    }
  }
  return { editionTerms, scope: creatorScope(source.tags), ...planContainerSearch(source, (text) => LETTER_RE.test(text), editionTerms) }
}
