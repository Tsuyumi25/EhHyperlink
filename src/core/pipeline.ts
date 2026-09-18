import { matchContainers, matchExtractedChapters } from './search/container'
import { dedupe, type EditionGroup, enrichHits, groupByLanguage, scoreEditions, toEdition } from './rank/edition'
import { fetchGalleryMetadata } from './eh/ehApi'
import { fetchSearch, type SearchHit } from './eh/ehSearch'
import type { SentRequest } from './eh/requestLog'
import type { SourceGallery } from './eh/galleryPage'
import { planSearch, type SearchPlan } from './search/searchPlan'
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

  const search = (terms: readonly string[]) => Promise.all(terms.map((term) => fetchSearch(origin, term, plan.scope)))
  const [editionPages, containerPages] = await Promise.all([
    search(plan.editionTerms),
    search(plan.containerTerms),
  ])

  /**
   * Chapter phrases are an edition phrase plus a counter, so their result set is
   * always a subset of the edition phrase's (257k Manga galleries, 4,706 phrase
   * pairs, no exception) and only the 25-row first page can hide anything. The
   * source matches its own edition phrase and a chapter cut from it is posted
   * later, so EH's newest-first page still holds every chapter while it holds
   * the source. Census: the source sits on every edition first page 74.6% of
   * the time, and skipping the chapter searches there loses no chapter at all
   * (950 chapters, identical recall) while sending 33.6% fewer requests. A
   * source missing from its own first page — a long series, or work text that
   * bracket blocks left non-contiguous (7.1%) — falls back to searching.
   */
  const sourceOnEveryFirstPage = editionPages.length > 0 && editionPages.every((page) => page.hits.some((hit) => hit.gid === source.gid))
  const chapterPages = sourceOnEveryFirstPage ? [] : await search(plan.chapterTerms)

  const candidates = dedupe([...editionPages, ...chapterPages].flatMap((page) => page.hits), source.gid)
  const containerHits = dedupe(containerPages.flatMap((page) => page.hits), source.gid)
  const { metadata, requests: metadataRequests } = await fetchGalleryMetadata([...candidates, ...containerHits].map(({ gid, token }) => ({ gid, token })))
  const searchPages = [...editionPages, ...containerPages, ...chapterPages]
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
