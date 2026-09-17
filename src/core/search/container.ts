import type { SearchHit } from '../eh/ehSearch'
import type { SourceGallery } from '../eh/galleryPage'
import { trigramDice } from '../rank/titleSimilarity'
import { analyzeTitle, normalizeTitleText } from '../title/titleStructure'

/**
 * Magazine / tankoubon links, both directions, for the Manga category only.
 *
 * ehwiki `Renaming` writes a single-chapter Manga as
 *   `[Artist] Title (Magazine or Tankoubon source) [Language] …`
 * so the `(context)` block of a chapter names its container, and a Manga gallery
 * without a context block may itself be one. Only the source gallery is expanded:
 * the editions it finds are never expanded into their own containers in turn.
 */

/** EH category whose `(context)` block is the publication source rather than a parody. */
export const CONTAINER_CATEGORY = 'Manga'

/** A container hit must name the source block almost verbatim; issue numbers differ by a digit. */
const CONTAINER_REQUIRED_SIMILARITY = 0.85

export interface ContainerPlan {
  /** quoted-phrase terms, one per title field, that retrieve the container this chapter came from */
  containerTerms: string[]
  /** the same container names normalized, for matching hits in either title field */
  containerNames: string[]
  /** true when this gallery can itself be a container: Manga with no context block of its own */
  isContainerCandidate: boolean
  /** for a container candidate, its full work text per field (volume number kept) so chapters naming this exact issue are found.
   * `pipeline.ts` sends these only when the edition first page may have truncated. */
  chapterTerms: string[]
}

const EMPTY_PLAN: ContainerPlan = { containerTerms: [], containerNames: [], isContainerCandidate: false, chapterTerms: [] }

function tagValues(tags: readonly string[], namespace: string): string[] {
  return tags.filter((tag) => tag.startsWith(`${namespace}:`)).map((tag) => normalizeTitleText(tag.slice(namespace.length + 1).replaceAll('_', ' ')))
}

function fieldsOf(gallery: { title: string; titleJpn: string }): string[] {
  return [gallery.title, gallery.titleJpn].filter(Boolean)
}

/** Which phrases to search for the container and, for a container, for its chapters. `hasLetters` guards against digit-only work text. */
export function planContainerSearch(source: SourceGallery, hasLetters: (text: string) => boolean, editionTerms: readonly string[]): ContainerPlan {
  if (source.category !== CONTAINER_CATEGORY) return EMPTY_PLAN

  const containerTerms: string[] = []
  const containerNames: string[] = []
  let hasContext = false
  const parodies = tagValues(source.tags, 'parody')
  for (const value of fieldsOf(source)) {
    const { context, contextText } = analyzeTitle(value)
    if (!context) continue
    hasContext = true
    if (parodies.includes(context) || containerNames.includes(context)) continue
    containerTerms.push(contextText)
    containerNames.push(context)
  }

  const isContainerCandidate = !hasContext
  const chapterTerms: string[] = []
  if (isContainerCandidate) {
    for (const value of fieldsOf(source)) {
      const { coreText } = analyzeTitle(value)
      if (hasLetters(coreText) && !editionTerms.includes(coreText) && !chapterTerms.includes(coreText)) chapterTerms.push(coreText)
    }
  }
  return { containerTerms, containerNames, isContainerCandidate, chapterTerms }
}

/** Hits whose work text in either field names one of the source's container blocks almost verbatim. */
export function matchContainers(containerNames: readonly string[], hits: readonly SearchHit[]): SearchHit[] {
  return hits.filter((hit) =>
    fieldsOf(hit).some((value) => containerNames.some((wanted) => trigramDice(analyzeTitle(value).core, wanted) >= CONTAINER_REQUIRED_SIMILARITY)),
  )
}

/**
 * The reverse: chapters cut from this gallery carry its work text as their own
 * context block, in either field. Exact match on the normalized text, so `Vol. 18`
 * and `Vol.18` agree but `Vol. 17` does not.
 */
export function matchExtractedChapters(source: SourceGallery, hits: readonly SearchHit[]): SearchHit[] {
  const names = fieldsOf(source).map((value) => analyzeTitle(value).core).filter(Boolean)
  if (names.length === 0) return []
  return hits.filter((hit) => fieldsOf(hit).some((value) => names.includes(analyzeTitle(value).context)))
}
