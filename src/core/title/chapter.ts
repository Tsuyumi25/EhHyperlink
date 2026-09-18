import { anyOf, charIn, exactly, maybe } from 'magic-regexp'
import { CJK_NUMERAL_CHARACTERS, parseCjkNumeral } from './cjkNumeral'
import { cjkLetter, compile, digit, end, optionalSpace, standalone, start, whitespace, whitespaceRun } from './pattern'

/**
 * Chapter and volume markers inside the unwrapped work text.
 *
 * ehwiki `Renaming` writes them as `Ch. 1-5` / `Vol. 8` in the romanized field and
 * `第1-5話` / `第8巻` in the Japanese field; Japanese and Chinese titles also count
 * in CJK numerals (`第三話`, `第十二巻`), and many series simply count with a bare
 * trailing number (`Work Title 5`, `Work Title 弐`). Everything before the marker is
 * shared by the whole series, so search terms drop it. Scoring keeps the full text.
 */

/**
 * `3`, `12`, `4.5`, `1-5`, `01-07`; up to three digits, an optional decimal part,
 * an optional range. Trailing decimals are series markers as often as integers in
 * the corpus (`.5` 60%, `.0` 55%, integers 68% have a same-creator sibling).
 */
const number = digit.times.between(1, 3)
  .and(maybe(
    exactly('.').and(digit.times.between(1, 2)),
  ))

const counter = number
  .and(maybe(
    exactly('-').and(number),
  ))

/** `三`, `十二`, `一百零二`, `弐`; captured so the run can be validated as a real numeral. */
const cjkCounter = charIn(CJK_NUMERAL_CHARACTERS).times.between(1, 5)
  .as('cjkNumeral')

/**
 * `II` … `IX`, `XI` … `XIII` as a closing token (NFKC has already turned `Ⅱ` into
 * `II`). Corpus: 9,305 + 201 occurrences with a same-creator sibling in 61.5% /
 * 63.2% of cases, against 69.7% for a bare Arabic integer measured the same way.
 * `X`, `XX`, `XXX` are out at 19.5% / 11.4%: crossings and the adult marker.
 */
const romanCounter = anyOf('ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'xi', 'xii', 'xiii')

/** Words that label a counter; `relation.ts` drops them when comparing counters, so `Ch. 10` and `10` agree. */
export const CHAPTER_WORDS = ['chapter', 'ch', 'volume', 'vol'] as const

/** `Ch. 3`, `Ch.3`, `Chapter 3`, `Vol. 8` — as a whole token, so `Chorus 3` keeps its `Ch`. */
const latinChapter = standalone(
  anyOf(...CHAPTER_WORDS)
    .and(maybe('.'))
    .and(optionalSpace)
    .and(counter),
)

/** `第3話`, `第1-7話`, `第8巻`, `第三話`, `第十二巻`. */
const cjkChapter = exactly('第')
  .and(anyOf(counter, cjkCounter))
  .and(charIn('話话巻卷'))

const CHAPTER_MARKER = compile(
  optionalSpace.and(anyOf(latinChapter, cjkChapter)),
  ['g', 'i'],
)

/**
 * Sequel and edition words that close a title as their own token. Each entry had
 * a same-creator sibling with a different ending in at least 60% of corpus cases
 * (前編 70%, 後編 77%, 中編 84%, 上巻 80%, 下巻 79%, 最終話 85%, 上 63%, 下 81%) or
 * an existing base work in at least 25% (改 39%, 完結編 43%, 総集編 28%, 新装版 34%).
 */
const sequelWord = anyOf(
  '前編', '中編', '後編', '前篇', '後篇',
  '上巻', '中巻', '下巻', '上', '中', '下',
  '序章', '最終話', '番外編', '完結編', '続', '改',
  '総集編', '完全版', '新装版',
)

/**
 * A bare number or sequel word counts only as the last whitespace token of its
 * group: `作品乙 5`, `作品乙 弐`, `作品乙 後編`, or the whole group (`作品乙・上`).
 * Japanese and Chinese titles glue an Arabic number to the last character
 * (`ほん5`, `本子5`), so after a CJK letter that form needs no space; kanji
 * numerals and sequel words still do (`唯一`, `天下` are words).
 */
const TRAILING_NUMBER = compile(
  anyOf(
    anyOf(counter, cjkCounter, romanCounter, sequelWord).after(anyOf(whitespace, start)),
    counter.after(cjkLetter),
  ).and(end),
  ['i'],
)

/**
 * Punctuation that closes a group inside the work text. A bare counter or sequel
 * word is read per group rather than only at the end of the whole string, which
 * is what reaches `作品乙。2`, `作品甲〜作品乙〜後編` and `作品乙・上`.
 *
 * Separators that carry counters of their own stay out. Corpus (every fifth
 * gallery) counts the group tails each would turn into a bare number: `-`
 * 39,566, `.` 27,579, `/` 6,236, `:` 2,248, `+` 1,241 — issue numbers
 * (`2002-11`), `Vol. 1`'s own period, fractions (`1/2`, `３／４`).
 *
 * `ー` stays out for the opposite reason: it is a letter — the prolonged sound
 * mark that ends words like `カラー` and `カンパニー`. Splitting on it cut the mark
 * off 1,270 titles; it belongs in `cjkLetter` instead, where `カラー9` reads as a
 * counter glued to the word.
 */
const GROUP_SEPARATOR = compile(charIn('。、！？〜～・').as('separator'))

/** A CJK run that is not actually a numeral (`十十`, `千`) is left in place. */
function unlessNotNumeral(replacement: string) {
  return (match: string, ...rest: unknown[]): string => {
    const groups = rest[rest.length - 1] as { cjkNumeral?: string } | undefined
    if (groups?.cjkNumeral !== undefined && parseCjkNumeral(groups.cjkNumeral) === null) return match
    return replacement
  }
}

/**
 * Markers out of the work text.
 *
 * A labelled form (`Ch. 3`, `第3話`) is taken wherever it sits — the label
 * itself settles what the number means. A bare counter or sequel word is taken
 * only as the last whitespace token of a group, and that is what leaves `天下`,
 * `中出`, `続行` and `改造` alone: a Japanese compound puts neither space nor
 * punctuation before its last character. Corpus: the condition takes `中` from
 * 274,586 occurrences down to 206, `下` from 25,587 to 596 and `改` from 7,769
 * to 327, while `最終話` keeps 73.3% of its own and `後編` 52.1%.
 *
 * A group emptied by the strip takes its separator with it, so `作品乙 後編。`
 * reads as `作品乙` rather than keeping a dangling `。`.
 */
export function stripChapterMarkers(text: string): string {
  const withoutChapters = text.replace(CHAPTER_MARKER, unlessNotNumeral(' ')).split(whitespaceRun).filter(Boolean).join(' ')
  const parts = withoutChapters.split(GROUP_SEPARATOR)
  const kept: string[] = []
  let removedAnything = false
  for (let index = 0; index < parts.length; index += 2) {
    const group = parts[index].trim()
    const shorter = group.replace(TRAILING_NUMBER, unlessNotNumeral('')).trim()
    if (shorter !== group) removedAnything = true
    if (!shorter) continue
    if (kept.length > 0) kept.push(parts[index - 1])
    kept.push(shorter)
  }
  // No marker found means no reason to touch the text: a title that merely ends
  // in punctuation (`作品乙。`) keeps it, and so does one with padded separators.
  if (!removedAnything) return withoutChapters
  // Everything stripped means the text was the counter, not a work plus one:
  // a digit-only title (`7`) keeps its own text and is filtered further up.
  const stripped = kept.join('')
  return stripped || withoutChapters
}
