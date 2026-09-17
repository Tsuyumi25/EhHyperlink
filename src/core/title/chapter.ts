import { anyOf, charIn, exactly, maybe } from 'magic-regexp'
import { CJK_NUMERAL_CHARACTERS, parseCjkNumeral } from './cjkNumeral'
import { cjkLetter, compile, digit, end, optionalSpace, standalone, whitespace, whitespaceRun } from './pattern'

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
 * A bare number or sequel word counts only at the very end: `Work Title 5`,
 * `Work Title 弐`, `Work Title 後編`. Japanese and Chinese titles glue an Arabic
 * number to the last character (`ほん5`, `本子5`), so after a CJK letter that form
 * needs no space; kanji numerals and sequel words still do (`唯一`, `天下` are words).
 */
const TRAILING_NUMBER = compile(
  anyOf(
    whitespace.times.atLeast(1).and(anyOf(counter, cjkCounter, romanCounter, sequelWord)),
    counter.after(cjkLetter),
  ).and(end),
  ['i'],
)

/** A CJK run that is not actually a numeral (`十十`, `千`) is left in place. */
function unlessNotNumeral(replacement: string) {
  return (match: string, ...rest: unknown[]): string => {
    const groups = rest[rest.length - 1] as { cjkNumeral?: string } | undefined
    if (groups?.cjkNumeral !== undefined && parseCjkNumeral(groups.cjkNumeral) === null) return match
    return replacement
  }
}

export function stripChapterMarkers(text: string): string {
  const withoutChapters = text.replace(CHAPTER_MARKER, unlessNotNumeral(' ')).split(whitespaceRun).filter(Boolean).join(' ')
  return withoutChapters.replace(TRAILING_NUMBER, unlessNotNumeral(''))
}
