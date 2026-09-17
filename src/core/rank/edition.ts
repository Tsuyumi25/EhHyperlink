import { detectLanguage } from './detectLanguage'
import type { GalleryMetadata } from '../eh/ehApi'
import type { SearchHit } from '../eh/ehSearch'
import type { SourceGallery } from '../eh/galleryPage'
import { type Language, languageOf } from './languages'
import { relationOf } from '../search/relation'
import { creatorsAgree, creatorVerdict, galleryTitleSimilarity, hasAiGeneratedTag, mentionsWork, relationshipIsBlocked, SIMILARITY_THRESHOLD } from './titleSimilarity'

/** Quality flags a reader wants to see next to an edition, read from tags. */
export type EditionFlag = 'rewrite' | 'rough translation'

export interface Edition {
  hit: SearchHit
  score: number
  language: string
  flags: EditionFlag[]
}

export interface EditionGroup {
  language: Language
  items: Edition[]
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
    .map(([language, items]) => ({ language: languageOf(language), items: items.sort((a, b) => b.score - a.score) }))
    .sort((a, b) => rank(a.language.value) - rank(b.language.value) || b.items.length - a.items.length)
}
