import { matchContainers, matchExtractedChapters } from './search/container'
import { dedupe, type EditionGroup, groupByLanguage, scoreEditions, toEdition } from './rank/edition'
import { fetchSearch, type LanguageScope, type SearchHit, type SearchResponse } from './eh/ehSearch'
import { requestStopsRun, resultStatus, type SearchRequest } from './eh/requestLog'
import type { SourceGallery } from './eh/galleryPage'
import { planSearch, queryOf, seriesQueriesOf, type SearchPlan } from './search/searchPlan'
import { hasAiGeneratedTag } from './rank/titleSimilarity'
import { sweepCache } from './eh/cache'
import { selectDiscoveries } from './search/discovery'

export type { Book, Edition, EditionFlag, EditionGroup } from './rank/edition'
export type { SearchRequest } from './eh/requestLog'

export interface JumpResult {
  plan: SearchPlan
  status: 'complete' | 'partial' | 'failed'
  /** every request this run sent, in send order; empty when the planner sent none */
  requests: SearchRequest[]
  /** unix ms of the oldest response in this result: how old what the reader sees is */
  dataAt: number
  /** the same book in other languages / releases, grouped by language */
  editions: EditionGroup[]
  /** other books of the same series, grouped by language */
  series: EditionGroup[]
  /** fixed-range matches or unscored direct-search results */
  related: EditionGroup[]
  /** chapters cut from this gallery when it is a magazine or tankoubon, grouped by language */
  chapters: EditionGroup[]
  /** magazines / tankoubon this chapter was cut from, grouped by language */
  containers: EditionGroup[]
}

/**
 * Searches one run may send, cached pages included so a revisit shows what the
 * first visit showed. Series searches go last, so the cap lands on them first.
 * Corpus replay of 20,000 galleries that send a series search: a cap of 5 cuts
 * 229 runs (1.1%) and costs an edition or series in 47 (0.24%); 8 cuts 66 and
 * costs 8; 3 cuts 886 and costs 150. Uncapped, the census worst case sends 143.
 */
export const DEFAULT_MAX_REQUESTS = 5

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
  /** 原刊與一般搜尋各自完成時先交付；完整結果仍由回傳的 Promise 提供。 */
  onResult?: (result: JumpResult) => void
  maxRequests?: number
  languages?: LanguageScope
}

/**
 * plan → search → classify → group.
 * Every step is a call into the module that owns that rule; nothing here decides
 * what a title means.
 */
export async function findEditions(
  source: SourceGallery,
  origin: string,
  priority: readonly string[],
  { force = false, onProgress, onResult, maxRequests = DEFAULT_MAX_REQUESTS, languages = 'all' }: FindOptions = {},
): Promise<JumpResult> {
  const plan = planSearch(source)
  // stale entries from an earlier build or an expired day; nothing waits on it
  void sweepCache().catch(() => {})
  if (hasAiGeneratedTag(source.tags)) {
    return { plan, status: 'complete', requests: [], dataAt: Date.now(), editions: [], series: [], related: [], chapters: [], containers: [] }
  }
  const seriesQueries = plan.mode === 'work' ? seriesQueriesOf(source) : []

  // One search at a time: `fetchSearch` holds the host's pace, and holding it
  // from inside a `Promise.all` would send the whole batch at once.
  let done = 0
  let total = plan.editionTerms.length + plan.containerTerms.length + seriesQueries.length
  const reportProgress = () => onProgress?.({ done, total: Math.min(total, maxRequests) })
  const requests: SearchRequest[] = []
  const search = async (queries: readonly string[]): Promise<SearchResponse[]> => {
    const pages: SearchResponse[] = []
    for (const query of queries) {
      if (requests.some(requestStopsRun)) break
      if (requests.length >= maxRequests) break
      const page = await fetchSearch(origin, query, plan.visibility, languages, force)
      pages.push(page)
      requests.push(page.request)
      done += 1
      reportProgress()
    }
    return pages
  }
  reportProgress()
  const containerPages = await search(plan.containerTerms.map((term) => queryOf(plan, term)))
  const containerHits = dedupe(containerPages.flatMap((page) => page.hits), source.gid)
  const containers = groupByLanguage(matchContainers(plan.containerNames, containerHits).map((hit) => toEdition(hit, null)), priority)
  if (plan.containerTerms.length > 0) {
    onResult?.({
      plan,
      status: resultStatus(requests),
      requests: [...requests],
      dataAt: containerPages.length > 0 ? Math.min(...containerPages.map((page) => page.at)) : Date.now(),
      editions: [],
      series: [],
      related: [],
      chapters: [],
      containers,
    })
  }
  const editionPages = await search(plan.editionTerms.map((term) => queryOf(plan, term)))

  /**
   * Chapter phrases are an edition phrase plus a counter, so their result set is
   * always a subset of the edition phrase's (257k Manga galleries, 4,706 phrase
   * pairs, no exception) and only the first-page limit can hide anything. The
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
    reportProgress()
    chapterPages = await search(plan.chapterTerms.map((term) => queryOf(plan, term)))
  }
  const candidates = new Map<number, SearchHit>()
  const searchPages = [...containerPages]
  const resultFor = (pages: readonly SearchResponse[]): JumpResult => {
    for (const page of pages) {
      for (const hit of page.hits) {
        if (hit.gid === source.gid) continue
        if (candidates.has(hit.gid)) continue
        candidates.set(hit.gid, hit)
      }
    }
    searchPages.push(...pages)
    const hits = [...candidates.values()]

    const chapters = plan.isContainerCandidate ? matchExtractedChapters(source, hits) : []
    const chapterGids = new Set(chapters.map((hit) => hit.gid))
    const { editions, series, related } = plan.mode === 'work'
      ? scoreEditions(source, hits.filter((hit) => !chapterGids.has(hit.gid)), plan.fixedRange)
      : { editions: [], series: [], related: selectDiscoveries(source, hits).map((hit) => toEdition(hit, null)) }
    const dataAt = Math.min(...searchPages.map((page) => page.at))

    return {
      plan,
      status: resultStatus(requests),
      requests: [...requests],
      dataAt: Number.isFinite(dataAt) ? dataAt : Date.now(),
      editions: groupByLanguage(editions, priority),
      series: groupByLanguage(series, priority),
      related: groupByLanguage(related, priority),
      chapters: groupByLanguage(chapters.map((hit) => toEdition(hit, null)), priority),
      containers,
    }
  }

  const ordinaryPages = [...editionPages, ...chapterPages]
  const ordinary = resultFor(ordinaryPages)
  if (seriesQueries.length === 0) return ordinary
  if (requests.some(requestStopsRun)) return ordinary
  if (ordinaryPages.length > 0) onResult?.(ordinary)
  return resultFor(await search(seriesQueries))
}
