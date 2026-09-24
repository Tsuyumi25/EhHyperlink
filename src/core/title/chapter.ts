import { anyOf, charIn, exactly, maybe, oneOrMore } from 'magic-regexp'
import { CJK_NUMERAL_CHARACTERS, parseCjkNumeral } from './cjkNumeral'
import { cjkLetter, compile, digit, end, letter, notUnicode, optionalSpace, punctuation, standalone, start, whitespace, whitespaceRun } from './pattern'

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

/**
 * Separators that write a span of counters. Corpus counts of
 * `<digits><separator><digits>`, and how many of those close their group:
 * `-` 108,895 / 68,421, `~` 5,130 / 2,898, `–` 477 / 449, `－` 176 / 102,
 * `—` 79 / 28.
 *
 * Left out: `,` (3,617) and `、` (443) enumerate rather than span
 * (`章1-4、10、12`), and `,` separates names as readily as numbers. The
 * fullwidth wave dashes are `GROUP_SEPARATOR` already, which reaches the same
 * titles by splitting them. `ー` has four occurrences and is a letter —
 * `cjkLetter` holds it so that `カラー9` reads as a counter glued to a word.
 */
const RANGE_SEPARATOR = charIn('-~–—－')

const counter = number
  .and(maybe(
    RANGE_SEPARATOR.and(number),
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

/**
 * Words that label a counter, so `Ch. 10` and `10` both read as `10`.
 *
 * Corpus, measured on tail labels the same way for every entry — a head carrying
 * two or more different numbers under the same word, against a head that also
 * exists with no label at all. The four the table already held set the bar:
 * volume 73.9% sibling (4,201 tails), ch 46.4% (17,713), vol 45.9% (45,064),
 * chapter 40.8% (8,065).
 *
 * Added at or above that bar: set 74.0% (2,238), sono 52.6% (1,309) — the
 * romanization of 其の, which only the romanized field ever writes — ep 51.8%
 * (1,969), episode 45.6% (2,440), pt 45.6% (1,511), and part 41.5% (34,520),
 * which is the largest gap of all: four times the tails of `chapter`.
 *
 * Left out: `no` at 59.5% (3,119) is both the particle の (`… Shiori no 7`) and
 * part of a work name (`Love Potion No.0`); `act` 30.9%, `cap` 33.9% and
 * `season` 24.0% fall under the bar, and `stage` clears it at 39.4% with only
 * 236 tails. `android` scores 4.7% and confirms the measure: it counts
 * characters, not parts.
 */
const CHAPTER_WORDS = ['chapter', 'episode', 'volume', 'part', 'sono', 'vol', 'set', 'ch', 'ep', 'pt'] as const

/** `Ch. 3`, `Ch.3`, `Chapter 3`, `Vol. 8` — as a whole token, so `Chorus 3` keeps its `Ch`. */
const latinChapter = standalone(
  anyOf(...CHAPTER_WORDS)
    .and(maybe('.'))
    .and(optionalSpace)
    .and(counter),
)

const hashChapter = exactly('#')
  .and(optionalSpace)
  .and(counter)
  .notBefore(anyOf(letter, digit))

/** `第3話`, `第1-7話`, `第8巻`, `第三話`, `第十二巻`. */
const cjkChapter = exactly('第')
  .and(anyOf(counter, cjkCounter))
  .and(charIn('話话巻卷'))

/**
 * Series words whose text alone settles that they mark a position in a series,
 * so they are read wherever they sit. Each entry had a same-creator sibling with
 * a different ending in at least 60% of corpus cases (前編 70%, 後編 77%,
 * 中編 84%, 上巻 80%, 下巻 79%, 最終話 85%) or an existing base work in at least
 * 25% (完結編 43%, 総集編 28%, 新装版 34%). The romanized forms below carry
 * their own counts.
 *
 * Harvested from every `編` / `篇` word in the corpus with at least 30
 * occurrences, then narrowed to the ones that name a position in a series rather
 * than a subject — a part named after what it contains is not the same work as a
 * part named after something else. Entries are listed longest-first so `続編`
 * wins over `続`.
 *
 * The Chinese and variant forms carry their own corpus counts (番外篇 431,
 * 后篇 146, 特别篇 143, 上篇 110, 下篇 103, 中篇 97, 總集篇 95, 总集篇 89,
 * 完结篇 40); a translated edition writes them where the original writes kanji,
 * and stripping both sides is what lets the remaining work text match.
 */
const kanjiSeriesWord = anyOf(
  '最終話', '番外編', '番外篇', '完結編', '完结篇', '総集編', '總集篇', '总集篇',
  '特別編', '特別篇', '特别篇', '完全版', '新装版', '続編',
  '前編', '後編', '中編', '前篇', '後篇', '后篇', '上篇', '中篇', '下篇',
  '上巻', '中巻', '下巻', '序章', '本編', '全編',
)

/**
 * The same words romanized. ehwiki `Renaming` romanizes the Japanese title into
 * the `title` field, so a part written `後編` in `title_jpn` reads `Kouhen`
 * there — and a table of kanji alone only ever reached one of the two fields,
 * leaving the two search phrases of one gallery out of step.
 *
 * Corpus, measured on group tails the same way as the kanji entries: a sibling
 * ending for gekan 76.9% (186 tails), chuuhen 76.3% (308), joukan 69.3% (212),
 * kouhen 68.4% (1,924), zenpen 60.8% (2,560); saishuuwa, bangaihen and
 * soushuuhen come in on the base-work side at 60.2% (211), 44.4% (342) and
 * 30.0% (2,161), which is how 総集編 and 完結編 earned their places.
 *
 * Left out: `kanketsuhen` (11.6% sibling, 22.6% base — under both bars),
 * `honpen` (0% / 18.8%), and `chuukan` (88% sibling but 25 tails, under the 30
 * the table asks for, and it romanizes 中間 as readily as 中巻).
 *
 * A letter on either side disqualifies the match, so `Kouhentai` keeps its text.
 * A digit does not: `Soushuuhen2` still reads as a marker.
 */
const romajiSeriesWord = anyOf(
  'soushuuhen', 'bangaihen', 'saishuuwa', 'chuuhen', 'zenpen', 'kouhen', 'joukan', 'gekan',
)
  .notAfter(letter)
  .notBefore(letter)

const seriesWord = anyOf(kanjiSeriesWord, romajiSeriesWord)

/**
 * Where a search phrase ends. Removing a mid-word series marker and joining the
 * halves produces
 * text no title contained (`作品乙ー後編ー` would read `作品乙ー ー`, and the
 * counter difference `relation.ts` takes would swallow the whole title), while
 * cutting at it yields `作品乙ー`, a prefix of the original.
 */
const CUT_POINT = compile(
  optionalSpace.and(anyOf(latinChapter, hashChapter, cjkChapter, seriesWord)),
  ['g', 'i'],
)

/**
 * A counter standing alone between two other tokens. It has no label and no
 * position to vouch for it, so the corpus has to: over 728 CJK and 3,155 Arabic
 * cases, cutting there finds a same-creator relative 84.1% / 89.6% of the time
 * against 62.9% / 49.7% for leaving the whole string as one phrase — the cut is
 * the only way in for 21.2% / 39.9% of them. A wrong cut (`Seinen 14 Sai`)
 * survives as a short phrase that the creator scope keeps narrow and the 0.5
 * similarity threshold drops, which costs less than never searching at all.
 */
const MID_COUNTER = compile(
  anyOf(counter, cjkCounter, romanCounter).after(whitespace).before(whitespace),
  ['g', 'i'],
)

/**
 * Words too short to settle anything on their own — `上`, `中`, `下` also sit
 * inside `以上`, `集中`, `天下`. Only position tells them apart, so they are read
 * as the last whitespace token of a group. Corpus: 下 63%, 上 63%, 改 39% had a
 * sibling or base work, but 下 appears inside another word 81.5% of the time.
 */
const positionOnlyWord = anyOf('続', '改', '上', '中', '下')

/**
 * A part named after its subject, closing the group: `作品乙 甲編`.
 *
 * These stay out of `seriesWord` on purpose. That table holds words whose text
 * alone says "position in a series", so they are read wherever they sit; a
 * subject part says nothing on its own and is recognized by shape — a token that
 * ends the group and ends in `編` / `篇`.
 *
 * Corpus: 10,741 fields end in a spaced 2–10 character `編` / `篇` token that the
 * table does not hold (`編` 8,655, `篇` 2,086; `编` is out at 56 with a single
 * multi-part series). 34.1% of them sit under a head carrying two or more
 * different parts — one head carries 36 — so leaving the part in means a phrase
 * that retrieves its own gallery and nothing else. Among galleries with a
 * creator tag, cutting there finds a same-creator relative 62.8% of the time
 * against 57.0% for the whole string.
 *
 * The counter keeps the part (`甲編`), which is what tells two parts of one
 * series apart after the phrase has dropped it.
 */
const subjectPart = notUnicode('White_Space').times.between(1, 9)
  .and(charIn('編篇'))

/**
 * An ellipsis, the one punctuation a bare counter may hide behind. The
 * separators that carry counters of their own stay out — `-` `.` `/` `:` `+`
 * write issue numbers (`2002-11`), version numbers (`1.2.3`) and fractions
 * (`1/2`) — and two periods is what tells an ellipsis from those: `...2` matches,
 * `1.2` does not.
 */
const ellipsis = anyOf(exactly('..'), charIn('…'))

/**
 * A bare counter or short word counts only as the last whitespace token of its
 * group: `作品乙 5`, `作品乙 弐`, or the whole group (`作品乙・上`). An ellipsis
 * counts as that boundary too, so the number behind one is read (`作品乙...2`).
 * Japanese and Chinese titles glue an Arabic number to the last character
 * (`ほん5`, `本子5`), so after a CJK letter that form needs no space; kanji
 * numerals and short words still do (`唯一`, `天下` are words).
 */
const TRAILING_NUMBER = compile(
  anyOf(
    anyOf(counter, cjkCounter, romanCounter, seriesWord, positionOnlyWord, subjectPart).after(anyOf(whitespace, start, ellipsis)),
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
 * Bare counters and sequel words out of each group's last whitespace token.
 *
 * That position is what leaves `天下`, `集中`, `続行` and `改造` alone: a Japanese
 * compound puts neither space nor punctuation before its last character. Corpus:
 * the condition takes `中` from 274,586 occurrences down to 206, `下` from 25,587
 * to 596 and `改` from 7,769 to 327, while `最終話` keeps 73.3% of its own and
 * `後編` 52.1%.
 *
 * A group emptied by the strip takes its separator with it, so `作品乙 後編。`
 * reads as `作品乙` rather than keeping a dangling `。`.
 *
 * What came off is returned rather than recovered from the length difference:
 * the kept groups are rejoined without their padding, so the result is not a
 * prefix of the input and `text.slice(phrase.length)` would read from the wrong
 * offset (`作品乙 ～副題甲～ 丙編` gave a counter of `甲～ 丙編`). The rightmost
 * strip wins — that is the group closest to where a series marker belongs.
 */
function stripGroupTails(text: string, alreadyStripped = false): { text: string; removed: string } {
  const parts = text.split(GROUP_SEPARATOR)
  const kept: string[] = []
  let removed = ''
  for (let index = 0; index < parts.length; index += 2) {
    const group = parts[index].trim()
    // Strip until the group stops shrinking. One pass leaves the punctuation the
    // counter hid behind, and a counter behind that (`Version 1.2.3` would read
    // `Version 1.`); each round takes the tail marks off so the next one sees the
    // number underneath.
    let shorter = group
    let found = false
    for (;;) {
      const stripped = shorter.replace(TRAILING_NUMBER, unlessNotNumeral(''))
      if (stripped !== shorter) found = true
      const next = trimTail(stripped).trim()
      if (next === shorter) break
      shorter = next
    }
    if (found) removed = group.slice(shorter.length).trim()
    if (!shorter) continue
    if (kept.length > 0) kept.push(parts[index - 1])
    kept.push(shorter)
  }
  // No marker found means no reason to touch the text: a title that merely ends
  // in punctuation (`作品乙。`) keeps it, and so does one with padded separators.
  if (!removed && !alreadyStripped) return { text, removed: '' }
  // Everything stripped means the text was the counter, not a work plus one:
  // a digit-only title (`7`) keeps its own text and is filtered further up.
  const stripped = kept.join('')
  return stripped ? { text: stripped, removed } : { text, removed: '' }
}

/** EH rejects a phrase of one character, so a cut may not leave less than this. */
const MIN_PHRASE_LENGTH = 2

/** Earliest cut point that leaves a usable phrase; a CJK numeral must be a real number. */
function firstCutPoint(text: string): { index: number; length: number } | null {
  let best: { index: number; length: number } | null = null
  for (const pattern of [CUT_POINT, MID_COUNTER]) {
    pattern.lastIndex = 0
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
      const numeral = match.groups?.cjkNumeral
      if (numeral !== undefined && parseCjkNumeral(numeral) === null) continue
      const found = { index: match.index, length: match[0].length }
      if (best === null || found.index < best.index) best = found
      break
    }
  }
  return best
}

const HAS_LETTER = compile(letter)
// `standalone` keeps the `V` of `Vol.` from reading as a roman counter.
const COUNTER_IN_MARKER = compile(anyOf(counter, cjkCounter, standalone(romanCounter)), ['i'])
/** `Vol. 02` → `02`, `第十二巻` → `十二`, `後編` → `後編`: a series word is its own counter. */
function counterIn(marker: string): string {
  const found = COUNTER_IN_MARKER.exec(marker.trim())
  return found ? found[0] : marker.trim()
}

/**
 * Marks that carry no work text when they sit at the edge of a phrase, so a
 * phrase is trimmed of them before it is searched. Editions in different
 * languages punctuate the same title differently, and a cut leaves whatever
 * bracketed the marker dangling.
 *
 * Harvested from the corpus: 80 characters open or close a coreText at least 200
 * times each, and 77 of them are `\p{P}` or `\p{S}` — punctuation, brackets,
 * arrows, hearts, the whole emoji range. These three are what the classes miss:
 *
 * - `U+FE0F` / `U+FE0E` variation selectors, category `Mn`, hide behind an emoji
 *   (`❤️` is `❤` plus `U+FE0F`), so without them an emoji tail never comes off
 *   (1,750 and 455 occurrences)
 * - `ー` the prolonged sound mark, category `Lm`: it stretches the sound before
 *   it rather than adding work text, so `作品乙ー` and `作品乙` retrieve the same
 *   galleries
 */
const edgeExtras = charIn('\uFE0F\uFE0Eー')
const edgeMark = anyOf(punctuation, whitespace, edgeExtras)
const EDGE_NOISE = compile(
  anyOf(
    oneOrMore(edgeMark).after(start),
    oneOrMore(edgeMark).and(end),
  ),
  ['g'],
)

/** The same marks at the tail only, so a strip loop keeps its result a prefix of the group. */
const TRAILING_NOISE = compile(oneOrMore(edgeMark).and(end))
const trimTail = (text: string) => text.replace(TRAILING_NOISE, '')

const trimEdges = (text: string) => text.replace(EDGE_NOISE, '')

export interface WorkText {
  /** what to search for: the segment up to its first marker */
  phrase: string
  /** which part of the series this is, label dropped: `Ch. 10` and `10` both read `10` */
  counter: string
}

/**
 * One title segment read as a work plus its position in a series.
 *
 * The marker is a boundary, not something to lift out: ehwiki `Renaming` puts it
 * after the work title, so the text before it is the work and the text after it
 * is a subtitle or a note. Corpus (256,762 ` | ` segments): the left side is the
 * longer one in 64.5% of the cases where the two sides differ, and the 32.1%
 * where the right side is longer are subtitles longer than the work they belong
 * to, not works.
 *
 * Cutting rather than removing matters twice over. A phrase joined across the
 * marker is a string the title never contained — 1,684 segments, 5.8% of the ones
 * a marker touches — and such a phrase cannot retrieve the source gallery itself,
 * which is what the first-page signal in `pipeline.ts` reads. The counter also
 * comes out clean: recovering it from the difference between the two strings used
 * to pull the subtitle in with it, so `… Vol. 02 Gamma` and `… Vol. 02 副題甲`
 * read as different parts instead of one part in two languages.
 *
 * A marker that opens the segment leaves only the right side. Bare counters and
 * short words are not boundaries — a number sits inside work text far too often
 * (`作品乙 其の2 作品丙`) — so they are read as the last token of a group instead.
 */
export function readWorkText(text: string): WorkText {
  const marker = firstCutPoint(text)
  if (marker === null) {
    const { text: phrase, removed } = stripGroupTails(text)
    return { phrase: trimEdges(phrase), counter: removed ? counterIn(removed) : '' }
  }
  const left = text.slice(0, marker.index).trim()
  const right = text.slice(marker.index + marker.length).trim()
  const work = HAS_LETTER.test(left) && left.length >= MIN_PHRASE_LENGTH ? left : right
  return {
    phrase: trimEdges(stripGroupTails(work, true).text),
    counter: counterIn(text.slice(marker.index, marker.index + marker.length)),
  }
}
