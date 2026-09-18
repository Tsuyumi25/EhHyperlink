import { matchContainers, matchExtractedChapters } from './search/container'
import { dedupe, type EditionGroup, enrichHits, groupByLanguage, scoreEditions, toEdition } from './rank/edition'
import { fetchGalleryMetadata } from './eh/ehApi'
import { fetchSearch, type SearchHit, type SearchResponse } from './eh/ehSearch'
import type { SentRequest } from './eh/requestLog'
import type { SourceGallery } from './eh/galleryPage'
import { planSearch, type SearchPlan } from './search/searchPlan'
import { hasAiGeneratedTag } from './rank/titleSimilarity'
import { sweepCache } from './eh/cache'

export type { Book, Edition, EditionFlag, EditionGroup } from './rank/edition'
export type { MetadataRequest, SearchRequest, SentRequest } from './eh/requestLog'

export interface JumpResult {
  plan: SearchPlan
  /** every request this run sent, in send order; empty when the planner sent none */
  requests: SentRequest[]
  /** galleries the metadata cache answered for; no request left for these */
  metadataFromCache: number
  /** unix ms of the oldest response in this result: how old what the reader sees is */
  dataAt: number
  /** the same book in other languages / releases, grouped by language */
  editions: EditionGroup[]
  /** other books of the same series, grouped by language */
  series: EditionGroup[]
  /** chapters cut from this gallery when it is a magazine or tankoubon, grouped by language */
  chapters: EditionGroup[]
  /** magazines / tankoubon this chapter was cut from */
  containers: SearchHit[]
}

/** How far the search stage has got, reported after each page. */
export interface SearchProgress {
  done: number
  /** pages planned so far; it grows when the chapter stage turns out to be needed */
  total: number
}

export interface FindOptions {
  /** ignore cached responses and overwrite them; the refetch button asks for this */
  force?: boolean
  onProgress?: (progress: SearchProgress) => void
}

/**
 * plan → search → enrich → classify → group.
 * Every step is a call into the module that owns that rule; nothing here decides
 * what a title means.
 */
export async function findEditions(
  source: SourceGallery,
  origin: string,
  priority: readonly string[],
  { force = false, onProgress }: FindOptions = {},
): Promise<JumpResult> {
  const plan = planSearch(source)
  // stale entries from an earlier build or an expired day; nothing waits on it
  void sweepCache().catch(() => {})
  if (hasAiGeneratedTag(source.tags)) {
    return { plan, requests: [], metadataFromCache: 0, dataAt: Date.now(), editions: [], series: [], chapters: [], containers: [] }
  }

  // One search at a time: `fetchSearch` holds the host's pace, and holding it
  // from inside a `Promise.all` would send the whole batch at once.
  let done = 0
  let total = plan.editionTerms.length + plan.containerTerms.length
  const search = async (terms: readonly string[]): Promise<SearchResponse[]> => {
    const pages: SearchResponse[] = []
    for (const term of terms) {
      pages.push(await fetchSearch(origin, term, plan.scope, force))
      done += 1
      onProgress?.({ done, total })
    }
    return pages
  }
  onProgress?.({ done, total })
  const editionPages = await search(plan.editionTerms)
  const containerPages = await search(plan.containerTerms)

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
  let chapterPages: SearchResponse[] = []
  if (!sourceOnEveryFirstPage) {
    total += plan.chapterTerms.length
    onProgress?.({ done, total })
    chapterPages = await search(plan.chapterTerms)
  }

  const candidates = dedupe([...editionPages, ...chapterPages].flatMap((page) => page.hits), source.gid)
  const containerHits = dedupe(containerPages.flatMap((page) => page.hits), source.gid)
  const meta = await fetchGalleryMetadata([...candidates, ...containerHits].map(({ gid, token }) => ({ gid, token })), force)
  const { metadata, requests: metadataRequests, fromCache: metadataFromCache } = meta
  const searchPages = [...editionPages, ...containerPages, ...chapterPages]
  const requests: SentRequest[] = [...searchPages.map((page) => page.request), ...metadataRequests]
  const enriched = enrichHits(candidates, metadata)

  const chapters = plan.isContainerCandidate ? matchExtractedChapters(source, enriched) : []
  const chapterGids = new Set(chapters.map((hit) => hit.gid))
  const { editions, series } = scoreEditions(source, enriched.filter((hit) => !chapterGids.has(hit.gid)))

  // the oldest response in this result: what the reader is actually looking at
  const dataAt = Math.min(meta.oldestAt, ...searchPages.map((page) => page.at))

  return {
    plan,
    requests,
    metadataFromCache,
    dataAt: Number.isFinite(dataAt) ? dataAt : Date.now(),
    editions: groupByLanguage(editions, priority),
    series: groupByLanguage(series, priority),
    chapters: groupByLanguage(chapters.map((hit) => toEdition(hit, 1)), priority),
    containers: matchContainers(plan.containerNames, enrichHits(containerHits, metadata)),
  }
}
