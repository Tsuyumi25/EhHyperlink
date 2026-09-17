import { matchContainers, matchExtractedChapters } from './search/container'
import { dedupe, type EditionGroup, enrichHits, groupByLanguage, scoreEditions, toEdition } from './rank/edition'
import { fetchGalleryMetadata } from './eh/ehApi'
import { fetchSearch, type SearchHit } from './eh/ehSearch'
import type { SourceGallery } from './eh/galleryPage'
import { planSearch, type SearchPlan } from './search/searchPlan'
import { hasAiGeneratedTag } from './rank/titleSimilarity'

export type { Edition, EditionFlag, EditionGroup } from './rank/edition'

export interface JumpResult {
  plan: SearchPlan
  /** the same book in other languages / releases, grouped by language */
  editions: EditionGroup[]
  /** other books of the same series, grouped by language */
  series: EditionGroup[]
  /** chapters cut from this gallery when it is a magazine or tankoubon, grouped by language */
  chapters: EditionGroup[]
  /** magazines / tankoubon this chapter was cut from */
  containers: SearchHit[]
}

/**
 * plan → search → enrich → classify → group.
 * Every step is a call into the module that owns that rule; nothing here decides
 * what a title means.
 */
export async function findEditions(source: SourceGallery, origin: string, priority: readonly string[]): Promise<JumpResult> {
  const plan = planSearch(source)
  if (hasAiGeneratedTag(source.tags)) return { plan, editions: [], series: [], chapters: [], containers: [] }

  const search = (terms: readonly string[]) => Promise.all(terms.map((term) => fetchSearch(origin, term, plan.scope)))
  const [editionPages, chapterPages, containerPages] = await Promise.all([
    search(plan.editionTerms),
    search(plan.chapterTerms),
    search(plan.containerTerms),
  ])

  const candidates = dedupe([...editionPages.flat(), ...chapterPages.flat()], source.gid)
  const containerHits = dedupe(containerPages.flat(), source.gid)
  const metadata = await fetchGalleryMetadata([...candidates, ...containerHits].map(({ gid, token }) => ({ gid, token })))
  const enriched = enrichHits(candidates, metadata)

  const chapters = plan.isContainerCandidate ? matchExtractedChapters(source, enriched) : []
  const chapterGids = new Set(chapters.map((hit) => hit.gid))
  const { editions, series } = scoreEditions(source, enriched.filter((hit) => !chapterGids.has(hit.gid)))

  return {
    plan,
    editions: groupByLanguage(editions, priority),
    series: groupByLanguage(series, priority),
    chapters: groupByLanguage(chapters.map((hit) => toEdition(hit, 1)), priority),
    containers: matchContainers(plan.containerNames, enrichHits(containerHits, metadata)),
  }
}
