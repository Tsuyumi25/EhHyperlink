import type { Book, Edition, EditionFlag, ScoredHits } from '../rank/edition'
import { dedupe, editionFlags, enrichHits, groupByLanguage, groupReleases, scoreEditions, toEdition } from '../rank/edition'
import { creatorVerdict, type CreatorVerdict, galleryTitleSimilarity, sharesWorkPhrase, SIMILARITY_THRESHOLD, titleSimilarity } from '../rank/titleSimilarity'
import { defineCase } from './check'
import { detectLanguage } from '../rank/detectLanguage'
import { gallery, type GalleryInput } from './gallery'
import type { GalleryMetadata } from '../eh/ehApi'
import { matchExtractedChapters } from '../search/container'
import { planSearch } from '../search/searchPlan'
import type { SearchHit } from '../eh/ehSearch'
import { selectDiscoveries } from '../search/discovery'

export interface HitInput {
  gid: number
  title?: string
  titleJpn?: string
  category?: string
  tags?: string[]
  posted?: number | null
}

export function hit(fields: HitInput): SearchHit {
  const gid = fields.gid
  return {
    gid,
    token: '0000000000',
    href: `https://e-hentai.org/g/${gid}/0000000000/`,
    title: fields.title ?? '',
    titleJpn: fields.titleJpn ?? '',
    category: fields.category ?? 'Doujinshi',
    tags: fields.tags ?? [],
    pages: null,
    posted: fields.posted ?? null,
    thumb: '',
    rating: null,
    torrentHref: null,
  }
}

/** Where a score sits against the acceptance threshold, or that nothing scored the row. */
export type ScoreVerdict = 'match' | 'below' | 'unscored'

function scoreVerdict(score: number | null): ScoreVerdict {
  if (score === null) return 'unscored'
  if (score >= SIMILARITY_THRESHOLD) return 'match'
  if (score < SIMILARITY_THRESHOLD) return 'below'
  throw new Error(`Invalid similarity score: ${score}`)
}

export interface PairInput {
  source: GalleryInput
  candidate: GalleryInput
  creators?: CreatorVerdict
}

function pairScore({ source, candidate, creators = 'unknown' }: PairInput): number {
  const left = gallery(source)
  const right = gallery(candidate)
  return galleryTitleSimilarity(left.title, left.titleJpn, right.title, right.titleJpn, creators)
}

export const similarity = defineCase<PairInput, ScoreVerdict>('gallery title similarity', (input) => scoreVerdict(pairScore(input)))

export const similarityScore = defineCase<PairInput, number>('gallery title similarity score', pairScore)

export const coreSimilarity = defineCase<{ left: string; right: string }, ScoreVerdict>('title similarity', ({ left, right }) =>
  scoreVerdict(titleSimilarity(left, right)),
)

export const sharedPhrase = defineCase<PairInput, boolean>('shares work phrase', ({ source, candidate }) => {
  const left = gallery(source)
  const right = gallery(candidate)
  return sharesWorkPhrase(left.title, left.titleJpn, right.title, right.titleJpn)
})

export const creatorTags = defineCase<{ source: string[]; candidate: string[] }, CreatorVerdict>('creator verdict', ({ source, candidate }) =>
  creatorVerdict(source, candidate),
)

export const language = defineCase<{ title: string; tags: string[] }, string>('detect language', ({ title, tags }) => detectLanguage(title, tags))

export const flags = defineCase<string[], EditionFlag[]>('edition flags', (tags) => editionFlags(tags))

export const enrichedEdition = defineCase<{ hit: HitInput; metadata: Partial<GalleryMetadata> }, { language: string; flags: EditionFlag[] }>(
  'enriched edition',
  (input) => {
    const bare = hit(input.hit)
    const [enriched] = enrichHits([bare], new Map([[bare.gid, { gid: bare.gid, title: '', titleJpn: '', category: 'Doujinshi', posted: null, thumb: '', rating: null, tags: [], ...input.metadata }]]))
    const edition = toEdition(enriched, 1)
    return { language: edition.language, flags: edition.flags }
  },
)

export interface RelationsInput {
  source: GalleryInput
  hits: HitInput[]
}

export interface Relations {
  editions: number[]
  series: number[]
  related: number[]
}

/**
 * The classification the pipeline runs: plan the search, then either take the
 * chapters out and score what is left on the planned route, or — when the plan
 * went straight at a tag — keep what came back unscored.
 */
function classify({ source, hits }: RelationsInput): ScoredHits {
  const gallerySource = gallery(source)
  const plan = planSearch(gallerySource)
  const candidates = hits.map(hit)
  if (plan.mode !== 'work') {
    return { editions: [], series: [], related: selectDiscoveries(gallerySource, candidates).map((discovery) => toEdition(discovery, null)) }
  }
  const unique = dedupe(candidates, gallerySource.gid)
  const chapters = plan.isContainerCandidate ? matchExtractedChapters(gallerySource, unique) : []
  const chapterGids = new Set(chapters.map((chapter) => chapter.gid))
  return scoreEditions(gallerySource, unique.filter((candidate) => !chapterGids.has(candidate.gid)), plan.fixedRange)
}

function gidsOf(editions: readonly Edition[]): number[] {
  return editions.map((edition) => edition.hit.gid)
}

export const relations = defineCase<RelationsInput, Relations>('relations', (input) => {
  const { editions, series, related } = classify(input)
  return { editions: gidsOf(editions), series: gidsOf(series), related: gidsOf(related) }
})

export const relatedScores = defineCase<RelationsInput, ScoreVerdict[]>('related scores', (input) =>
  classify(input).related.map((edition) => scoreVerdict(edition.score)),
)

/** Grouping reads the titles, not the score; every row carries the same one. */
const GROUPED_SCORE = 0.9

function editionsOf(inputs: readonly HitInput[]): Edition[] {
  return inputs.map((input) => toEdition(hit(input), GROUPED_SCORE))
}

function bookGids(books: readonly Book[]): number[][] {
  return books.map((book) => book.releases.map((release) => release.hit.gid))
}

export const releaseGroups = defineCase<{ hits: HitInput[] }, number[][]>('release groups', ({ hits }) =>
  bookGids(groupReleases(editionsOf(hits))).sort((left, right) => left[0] - right[0]),
)

export const releaseOrder = defineCase<{ hits: HitInput[] }, number[][]>('release order', ({ hits }) => bookGids(groupReleases(editionsOf(hits))))

export interface LanguageBooks {
  language: string
  books: number[][]
}

export const languageGroups = defineCase<{ hits: HitInput[]; priority: string[] }, LanguageBooks[]>('language groups', ({ hits, priority }) =>
  groupByLanguage(editionsOf(hits), priority).map((group) => ({ language: group.language.value, books: bookGids(group.books) })),
)
