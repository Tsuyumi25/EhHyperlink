import { analyzeTitle, TITLE_BAR } from '../title/titleStructure'
import { detectLanguage } from './detectLanguage'
import type { GalleryMetadata } from '../eh/ehApi'
import { normalizeMarkerText } from '../title/titleMarkers'
import { parseCjkNumeral } from '../title/cjkNumeral'
import { readWorkText } from '../title/chapter'
import type { SearchHit } from '../eh/ehSearch'
import type { SourceGallery } from '../eh/galleryPage'
import { type Language, languageOf } from './languages'
import { relationOf } from '../search/relation'
import { creatorsAgree, creatorVerdict, galleryTitleSimilarity, hasAiGeneratedTag, mentionsWork, relationshipIsBlocked, sharesWorkPhrase, SIMILARITY_THRESHOLD } from './titleSimilarity'

/** Quality flags a reader wants to see next to an edition, read from tags. */
export type EditionFlag = 'rewrite' | 'rough translation' | 'extraneous ads'

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

/**
 * Each entry is something a reader would want to know before opening the
 * gallery: the text was rewritten rather than translated, the translation is
 * rough, or the pages carry advertising unrelated to the work.
 */
const FLAG_TAGS: Record<string, EditionFlag> = {
  'language:rewrite': 'rewrite',
  'other:rough translation': 'rough translation',
  'other:extraneous ads': 'extraneous ads',
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

/**
 * Search rows carry one title field and, in some list modes, no tags; the
 * metadata API fills those, plus the cover and rating no list mode hands over
 * in a usable form.
 */
export function enrichHits(hits: readonly SearchHit[], metadata: ReadonlyMap<number, GalleryMetadata>): SearchHit[] {
  return hits.map((hit) => {
    const meta = metadata.get(hit.gid)
    if (!meta) return hit
    return {
      ...hit,
      title: meta.title || hit.title,
      titleJpn: meta.titleJpn,
      tags: meta.tags.length > 0 ? meta.tags : hit.tags,
      posted: meta.posted ?? hit.posted,
      thumb: meta.thumb || hit.thumb,
      rating: meta.rating ?? hit.rating,
    }
  })
}

/**
 * Numeric value of a counter, for ordering: `02` reads 2 and `1-5` reads 1, so a
 * part number sorts by size rather than by text (`10` after `9`). A counter with
 * no number in it — `後編`, a subject part — has no size to sort by and reads null,
 * and the upload date orders those instead.
 */
function counterNumber(counter: string): number | null {
  let digits = ''
  for (const character of counter) {
    if (character >= '0' && character <= '9') digits += character
    else if (digits) break
  }
  if (digits) return Number(digits)
  return parseCjkNumeral(counter)
}

function orderOf(edition: Edition): { number: number | null; posted: number } {
  const parts = analyzeTitle(edition.hit.title || edition.hit.titleJpn)
  const halves = parts.coreSegments.join(' ').split(TITLE_BAR)
  let counter = readWorkText(halves[0]).counter
  for (const half of halves.slice(1)) {
    if (counter) break
    counter = readWorkText(half).counter
  }
  return { number: counterNumber(counter), posted: edition.hit.posted ?? Number.MAX_SAFE_INTEGER }
}

/**
 * Reading order: the part number decides when both rows carry one, and the
 * upload date decides otherwise — which is also what orders the releases of one
 * book, and the parts of a series whose markers are words rather than numbers
 * (`前編` was posted before `後編`). A row the metadata API never answered for
 * sorts last rather than first.
 */
function compareEditions(left: Edition, right: Edition): number {
  const a = orderOf(left)
  const b = orderOf(right)
  if (a.number !== null && b.number !== null && a.number !== b.number) return a.number - b.number
  return a.posted - b.posted
}

export function toEdition(hit: SearchHit, score: number): Edition {
  return { hit, score, language: detectLanguage(hit.title, hit.tags), flags: editionFlags(hit.tags) }
}

/** The three relations a scored hit can hold to the source. */
export interface ScoredHits {
  /** the same book, another release */
  editions: Edition[]
  /** another book of the same series, established by a shared phrase or a named work */
  series: Edition[]
  /**
   * Same creator and vocabulary the source itself uses, with nothing else
   * settling the relation. A sequel written as free prose lands here, and so
   * does an unrelated book of theirs that happens to reuse a word.
   */
  maybeSeries: Edition[]
}

/**
 * Score every hit against the source and sort it into one of the three
 * relations.
 *
 * Two ways into `series`. With the creator settled by tags, the host already
 * filtered — the search carried both the work phrase and the creator — so a
 * shared phrase admits the row and the score is left to describe it. Without
 * that, the score has to establish the relation itself and the threshold
 * applies. A third route admits titles that share no phrase at all: the creator
 * is settled and one title names the other's work inside a block.
 *
 * `fixedRange` opens `maybeSeries`. The query was then a slice of this gallery's
 * own title sent against one creator's shelf, so every row agrees on the person
 * and on vocabulary the source uses — which is what the slices were cut to
 * find, and also what an unrelated book of theirs can satisfy by accident. The
 * relation stays unproven, so these are kept apart from `series` rather than
 * mixed into it. `sharesWorkPhrase` still earns the express route: clearing it
 * means the phrase itself matched, so `relationOf` can tell an edition of the
 * same book from a sibling.
 */
export function scoreEditions(source: SourceGallery, hits: readonly SearchHit[], fixedRange = false): ScoredHits {
  const editions: Edition[] = []
  const series: Edition[] = []
  const maybeSeries: Edition[] = []
  for (const hit of hits) {
    if (hasAiGeneratedTag(hit.tags)) continue
    const creators = creatorVerdict(source.tags, hit.tags)
    const titles = [source.title, source.titleJpn, hit.title, hit.titleJpn] as const
    const score = galleryTitleSimilarity(...titles, creators)
    const blocked = relationshipIsBlocked(...titles, creators)
    const admitted = creators === 'same' ? !blocked && sharesWorkPhrase(...titles) : score >= SIMILARITY_THRESHOLD
    if (admitted) {
      ;(relationOf(source, hit) === 'edition' ? editions : series).push(toEdition(hit, score))
    } else if (!blocked && creatorsAgree(...titles, creators) && mentionsWork(...titles)) {
      series.push(toEdition(hit, SIMILARITY_THRESHOLD))
    } else if (fixedRange && creators === 'same' && !blocked) {
      maybeSeries.push(toEdition(hit, score))
    }
  }
  return { editions, series, maybeSeries }
}

/**
 * Every run of digits in the text, in the order written. A volume number does
 * not have to sit at the end to separate two books (`Vol. 2 Work Beta`), and the
 * trailing counter alone would read both as the same one.
 */
function numbersOf(text: string): string[] {
  const numbers: string[] = []
  let run = ''
  for (const character of text) {
    if (character >= '0' && character <= '9') run += character
    else if (run) {
      numbers.push(run)
      run = ''
    }
  }
  if (run) numbers.push(run)
  return numbers
}

/**
 * Everything that has to agree before two releases are called one book: creator
 * block, work phrase, series counter, the numbers written anywhere in the work
 * text, and whatever a mirrored mark wrapped. Structural equality rather than a
 * similarity score — grouping asserts "these are one book", and a reader misled
 * by a wrong group cannot see that the titles differed.
 *
 * Only the half before the bar is keyed on. ehwiki puts the translated title
 * after it, and that half differs between releases or is missing entirely, while
 * the original is written the same way every time — keying on the whole text
 * splits one book into one group per translation (corpus sample: 987 keys
 * collapse, 828 books go from alone to standing beside a sibling).
 *
 * Two things the phrase cannot carry decide the rest. The counter is looked for
 * on both sides of the bar, because 6.8% of barred titles write it only after
 * (`Work Beta | 作品乙 Ch. 1`). And the wrapped subtitle is compared, because a
 * search phrase drops it and two parts of one series are then written alike
 * (`Work Beta ~副題甲~` against `Work Beta ~副題乙~`).
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
  return [
    parts.identity,
    normalizeMarkerText(head.phrase),
    counter,
    numbersOf(halves[0]).join('.'),
    parts.wrapped.map(normalizeMarkerText).sort().join('.'),
  ].join('\u0000')
}

/**
 * Releases of one book, side by side. Every title is shown as written — the
 * differences between two scanlations live in blocks we cannot rank, so the
 * grouping only says which rows belong together and the reader reads the rest.
 *
 * Both levels take the same order, and a book travels on its leading release:
 * sorting inside first puts that release at index 0, so the books line up by
 * the earliest part and earliest upload each of them holds.
 */
export function groupReleases(editions: readonly Edition[]): Book[] {
  const byBook = new Map<string, Edition[]>()
  for (const edition of editions) {
    const key = bookKeyOf(edition.hit)
    const bucket = byBook.get(key) ?? []
    bucket.push(edition)
    byBook.set(key, bucket)
  }
  return [...byBook.values()]
    .map((releases) => ({ releases: [...releases].sort(compareEditions) }))
    .sort((left, right) => compareEditions(left.releases[0], right.releases[0]))
}

/** Bucket editions by language, reading order inside a bucket, reader's languages first across buckets. */
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
    .map(([language, items]) => ({ language: languageOf(language), books: groupReleases(items) }))
    .sort((a, b) => rank(a.language.value) - rank(b.language.value) || b.books.length - a.books.length)
}
