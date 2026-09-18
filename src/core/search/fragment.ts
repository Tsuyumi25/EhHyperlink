import { cjkLetter, compile, han, letter, whitespaceRun } from '../title/pattern'

const HAN_PAIR = compile(han.times(2))
const CJK = compile(cjkLetter)
const HAS_LETTER = compile(letter)

/** Characters in one CJK slice. Two is what the creator scope can afford. */
const SLICE = 2

/**
 * Short slices of one work phrase, one from each half.
 *
 * The creator scope pins the search to one person's shelf — 86 to 174 galleries
 * at the median, size-biased — so a query does not have to identify the book.
 * It only has to survive whatever the title does around it: a counter, a
 * subtitle, a different translator's wording, a sequel written as free prose.
 * Corpus run over 694 galleries inside that scope: the whole work phrase finds
 * 3 siblings at p50 and nothing at all for 16.6% of galleries, two slices find
 * 6 and add something new for 43.4% of galleries while losing 0.3 on average.
 *
 * Two slices rather than one because bracket filtering leaves a chapter marker
 * standing in about a fifth of titles, and no work puts one at both ends — so
 * whichever end carries the marker, the slice from the other end is clean.
 *
 * Han over kana: a han pair is 43x rarer than a kana pair (see `pattern.ts`),
 * which is the whole of the "avoid frequent characters" rule. Kana is taken
 * only when a half holds no han pair at all.
 */
export function fragmentsOf(phrase: string): string[] {
  const text = phrase.trim()
  if (!text || !HAS_LETTER.test(text)) return []
  if (CJK.test(text)) {
    // below four characters the two halves would overlap, and the phrase is
    // already as short as a slice
    return text.length < SLICE * 2 ? [text] : unique(cjkSlices(text))
  }
  // A phrase with no CJK is romanised or English: its words are already the
  // short, rare units, and cutting inside one would search a syllable.
  const tokens = text.split(whitespaceRun).filter(Boolean)
  return tokens.length < 2 ? [text] : unique(tokenSlices(tokens))
}

function unique(slices: readonly string[]): string[] {
  return [...new Set(slices.filter(Boolean))]
}

/**
 * Words EH does not index, from ehwiki `Gallery_Searching`: it merges these
 * into the phrase beside them, and a search that is only one of them is run as
 * an exact tag with a warning — which returns nothing at all. The common size
 * adjectives are on the same list.
 */
const UNINDEXED = new Set([
  'a',
  'an',
  'ai',
  'to',
  'the',
  'and',
  'so',
  'on',
  'of',
  'in',
  'small',
  'big',
  'huge',
  'gigantic',
])

function indexable(token: string): boolean {
  return !UNINDEXED.has(token.toLowerCase())
}

/**
 * Longest indexable token of each half: length stands in for rarity, and two
 * characters is the floor ehwiki gives for avoiding a wrong-character match.
 *
 * When every word is unindexable the whole phrase goes out instead — quoted and
 * with other words beside it, it can still match, while a lone `the` cannot.
 * One usable word yields one request, not two.
 */
function tokenSlices(tokens: readonly string[]): string[] {
  const usable = tokens.filter((token) => indexable(token) && token.length >= SLICE)
  if (usable.length === 0) return [tokens.join(' ')]
  const half = Math.ceil(usable.length / 2)
  return [longest(usable.slice(0, half)), longest(usable.slice(half))]
}

function longest(tokens: readonly string[]): string {
  return tokens.reduce((best, token) => (token.length > best.length ? token : best), '')
}

/**
 * First han pair of the leading half, last han pair of the trailing half; the
 * edge characters of that half when it holds none.
 */
function cjkSlices(text: string): string[] {
  const half = Math.max(SLICE, Math.floor(text.length / 2))
  const lead = text.slice(0, half)
  const trail = text.slice(-half)
  return [firstHanPair(lead) ?? lead.slice(0, SLICE), lastHanPair(trail) ?? trail.slice(-SLICE)]
}

function firstHanPair(text: string): string | null {
  for (let index = 0; index + SLICE <= text.length; index += 1) {
    const pair = text.slice(index, index + SLICE)
    if (HAN_PAIR.test(pair)) return pair
  }
  return null
}

function lastHanPair(text: string): string | null {
  for (let index = text.length - SLICE; index >= 0; index -= 1) {
    const pair = text.slice(index, index + SLICE)
    if (HAN_PAIR.test(pair)) return pair
  }
  return null
}
