import { analyzeTitle } from '../title/titleStructure'
import { detectLanguage } from './detectLanguage'
import type { GalleryMetadata } from '../eh/ehApi'
import { normalizeMarkerText } from '../title/titleMarkers'
import { readWorkText } from '../title/chapter'
import type { SearchHit } from '../eh/ehSearch'
import type { SourceGallery } from '../eh/galleryPage'
import { type Language, languageOf } from './languages'
import { relationOf } from '../search/relation'
import { TITLE_BAR } from '../search/searchPlan'
import { creatorsAgree, creatorVerdict, galleryTitleSimilarity, hasAiGeneratedTag, mentionsWork, relationshipIsBlocked, SIMILARITY_THRESHOLD } from './titleSimilarity'

/** Quality flags a reader wants to see next to an edition, read from tags. */
export type EditionFlag = 'rewrite' | 'rough translation'

export interface Edition {
  hit: SearchHit
  score: number
  language: string
  flags: EditionFlag[]
}

/** Releases the search found of one book, kept together so a reader sees them as one. */
export interface Book {
  releases: Edition[]
}

export interface EditionGroup {
  language: Language
  books: Book[]
}

const FLAG_TAGS: Record<string, EditionFlag> = {
  'language:rewrite': 'rewrite',
  'other:rough translation': 'rough translation',
}

export function editionFlags(tags: readonly string[]): EditionFlag[] {
  const flags: EditionFlag[] = []
  for (const tag of tags) {
    const flag = FLAG_TAGS[tag.replaceAll('_', ' ')]
    if (flag && !flags.includes(flag)) flags.push(flag)
  }
  return flags
}

/** Drop the source gallery and repeated gids, keeping first occurrence order. */
export function dedupe(hits: readonly SearchHit[], excludeGid: number): SearchHit[] {
  const seen = new Set<number>([excludeGid])
  const unique: SearchHit[] = []
  for (const hit of hits) {
    if (seen.has(hit.gid)) continue
    seen.add(hit.gid)
    unique.push(hit)
  }
  return unique
}

/** Search rows carry one title field and, in some list modes, no tags; the metadata API fills both. */
export function enrichHits(hits: readonly SearchHit[], metadata: ReadonlyMap<number, GalleryMetadata>): SearchHit[] {
  return hits.map((hit) => {
    const meta = metadata.get(hit.gid)
    if (!meta) return hit
    return { ...hit, title: meta.title || hit.title, titleJpn: meta.titleJpn, tags: meta.tags.length > 0 ? meta.tags : hit.tags }
  })
}

export function toEdition(hit: SearchHit, score: number): Edition {
  return { hit, score, language: detectLanguage(hit.title, hit.tags), flags: editionFlags(hit.tags) }
}

/**
 * Score every hit against the source and split same-book editions from series
 * siblings. Two routes into the series bucket: the work titles are alike, or the
 * creator is settled and one title names the other's work.
 */
export function scoreEditions(source: SourceGallery, hits: readonly SearchHit[]): { editions: Edition[]; series: Edition[] } {
  const editions: Edition[] = []
  const series: Edition[] = []
  for (const hit of hits) {
    if (hasAiGeneratedTag(hit.tags)) continue
    const creators = creatorVerdict(source.tags, hit.tags)
    const titles = [source.title, source.titleJpn, hit.title, hit.titleJpn] as const
    const score = galleryTitleSimilarity(...titles, creators)
    if (score >= SIMILARITY_THRESHOLD) {
      ;(relationOf(source, hit) === 'edition' ? editions : series).push(toEdition(hit, score))
    } else if (!relationshipIsBlocked(...titles, creators) && creatorsAgree(...titles, creators) && mentionsWork(...titles)) {
      series.push(toEdition(hit, SIMILARITY_THRESHOLD))
    }
  }
  return { editions, series }
}

/**
 * The identity a release shares with every other release of the same book:
 * creator block, work phrase, series counter. Structural equality rather than a
 * similarity score — grouping asserts "these are one book", and a reader misled
 * by a wrong group cannot see that the titles differed.
 *
 * Only the half before the bar is keyed on. ehwiki puts the translated title
 * after it, and that half differs between releases or is missing entirely, while
 * the original is written the same way every time — keying on the whole text
 * splits one book into one group per translation (corpus sample: 987 keys
 * collapse, 828 books go from alone to standing beside a sibling).
 *
 * The counter is looked for on both sides: 6.8% of barred titles write it only
 * after the bar (`Work Beta | 作品乙 Ch. 1`), and losing it would merge two
 * chapters into one book.
 */
function bookKeyOf(hit: SearchHit): string {
  const parts = analyzeTitle(hit.title || hit.titleJpn)
  const halves = parts.coreSegments.join(' ').split(TITLE_BAR)
  const head = readWorkText(halves[0])
  let counter = head.counter
  for (const half of halves.slice(1)) {
    if (counter) break
    counter = readWorkText(half).counter
  }
  return [parts.identity, normalizeMarkerText(head.phrase), counter].join('\u0000')
}

/**
 * Releases of one book, side by side. Every title is shown as written — the
 * differences between two scanlations live in blocks we cannot rank, so the
 * grouping only says which rows belong together and the reader reads the rest.
 */
export function groupReleases(editions: readonly Edition[]): Book[] {
  const byBook = new Map<string, Edition[]>()
  for (const edition of editions) {
    const key = bookKeyOf(edition.hit)
    const bucket = byBook.get(key) ?? []
    bucket.push(edition)
    byBook.set(key, bucket)
  }
  return [...byBook.values()].map((releases) => ({ releases }))
}

/** Bucket editions by language, best score first inside a bucket, reader's languages first across buckets. */
export function groupByLanguage(editions: readonly Edition[], priority: readonly string[]): EditionGroup[] {
  const byLanguage = new Map<string, Edition[]>()
  for (const edition of editions) {
    const bucket = byLanguage.get(edition.language) ?? []
    bucket.push(edition)
    byLanguage.set(edition.language, bucket)
  }
  const rank = (language: string) => {
    const index = priority.indexOf(language)
    return index === -1 ? priority.length : index
  }
  return [...byLanguage.entries()]
    .map(([language, items]) => ({ language: languageOf(language), books: groupReleases(items.sort((a, b) => b.score - a.score)) }))
    .sort((a, b) => rank(a.language.value) - rank(b.language.value) || b.books.length - a.books.length)
}
