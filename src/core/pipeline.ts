import { matchContainers, matchExtractedChapters } from './search/container'
import { dedupe, type EditionGroup, enrichHits, groupByLanguage, scoreEditions, toEdition } from './rank/edition'
import { fetchGalleryMetadata } from './eh/ehApi'
import { fetchSearch, type SearchHit } from './eh/ehSearch'
import type { SentRequest } from './eh/requestLog'
import type { SourceGallery } from './eh/galleryPage'
import { planSearch, queryGroups, type SearchPlan } from './search/searchPlan'
import { hasAiGeneratedTag } from './rank/titleSimilarity'

export type { Edition, EditionFlag, EditionGroup } from './rank/edition'
export type { MetadataRequest, SearchRequest, SentRequest } from './eh/requestLog'

export interface JumpResult {
  plan: SearchPlan
  /** every request this run sent, in send order; empty when the planner sent none */
  requests: SentRequest[]
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
  if (hasAiGeneratedTag(source.tags)) return { plan, requests: [], editions: [], series: [], chapters: [], containers: [] }

  const search = (terms: readonly string[]) =>
    Promise.all(queryGroups(terms, plan.scope).map((group) => fetchSearch(origin, group, plan.scope)))
  const [editionPages, containerPages] = await Promise.all([
    search(plan.editionTerms),
    search(plan.containerTerms),
  ])

  /**
   * One signal, two uses: whether an edition first page could have truncated.
   *
   * The source always matches its own edition phrase, so its absence from a
   * first page means EH cut the results off at 25 rows; while it is present
   * nothing is hidden. That settles both follow-ups at once:
   *
   * - Chapter phrases are an edition phrase plus a counter, so their result set
   *   is always a subset (257k Manga galleries, 4,706 phrase pairs, no
   *   exception), and a chapter cut from the source is posted later, so it sits
   *   ahead of the source on a newest-first page.
   * - Merged phrases share one 25-row page where separate requests would have
   *   had 25 each, so re-sending them apart is only worth it after a cut.
   *
   * Census: the source sits on every edition first page 74.6% of the time,
   * 91.3% once phrases are merged, and skipping the chapter searches there
   * loses no chapter at all (950 chapters, identical recall). A source missing
   * from its own first page — a long series, or work text that bracket blocks
   * left non-contiguous (7.1%) — falls back to both.
   */
  const sourceOnEveryFirstPage = editionPages.length > 0 && editionPages.every((page) => page.hits.some((hit) => hit.gid === source.gid))
  const merged = editionPages.length < plan.editionTerms.length
  const fallbackGroups = merged ? plan.editionTerms.map((term) => [term]) : []
  const fallbackPages = sourceOnEveryFirstPage
    ? []
    : await Promise.all([...fallbackGroups, ...queryGroups(plan.chapterTerms, plan.scope)].map((group) => fetchSearch(origin, group, plan.scope)))

  const candidates = dedupe([...editionPages, ...fallbackPages].flatMap((page) => page.hits), source.gid)
  const containerHits = dedupe(containerPages.flatMap((page) => page.hits), source.gid)
  const { metadata, requests: metadataRequests } = await fetchGalleryMetadata([...candidates, ...containerHits].map(({ gid, token }) => ({ gid, token })))
  const searchPages = [...editionPages, ...containerPages, ...fallbackPages]
  const requests: SentRequest[] = [...searchPages.map((page) => page.request), ...metadataRequests]
  const enriched = enrichHits(candidates, metadata)

  const chapters = plan.isContainerCandidate ? matchExtractedChapters(source, enriched) : []
  const chapterGids = new Set(chapters.map((hit) => hit.gid))
  const { editions, series } = scoreEditions(source, enriched.filter((hit) => !chapterGids.has(hit.gid)))

  return {
    plan,
    requests,
    editions: groupByLanguage(editions, priority),
    series: groupByLanguage(series, priority),
    chapters: groupByLanguage(chapters.map((hit) => toEdition(hit, 1)), priority),
    containers: matchContainers(plan.containerNames, enrichHits(containerHits, metadata)),
  }
}
