import { wordBreakRun } from '../title/pattern'

export interface MarkedPart {
  text: string
  hit: boolean
}

/** A word piece shorter than this lights up in nearly every line; it only counts as part of a whole keyword. */
const MIN_PIECE_CHARACTERS = 2

/**
 * Each character folded on its own, so a folded index maps back to the
 * original one: full-width and half-width forms, and letter case, compare
 * equal (`ＡＢＣ` matches `abc`).
 */
function fold(text: string): { folded: string; origin: number[] } {
  let folded = ''
  const origin: number[] = []
  let index = 0
  for (const character of text) {
    const piece = character.normalize('NFKC').toLowerCase()
    folded += piece
    for (let unit = 0; unit < piece.length; unit++) origin.push(index)
    index += character.length
  }
  origin.push(index)
  return { folded, origin }
}

/**
 * The keywords as the search engines match them: each whole, and each word
 * between its spaces and punctuation. Sites drop or swap a title's decoration
 * (`作品甲〜副題〜` listed as `作品甲〜副題` or `作品甲 副題`), so the whole
 * keyword alone would miss them.
 */
export function matchWords(keywords: readonly string[]): string[] {
  const words = new Set<string>()
  for (const keyword of keywords) {
    const whole = fold(keyword.trim()).folded
    if (whole) words.add(whole)
    for (const piece of keyword.split(wordBreakRun)) {
      if ([...piece].length >= MIN_PIECE_CHARACTERS) words.add(fold(piece).folded)
    }
  }
  return [...words]
}

/**
 * `text` cut into runs that match one of `words` (from `matchWords`) and runs
 * that do not, in order, the way a search engine bolds the query in its
 * results. Overlapping matches merge into one run.
 */
export function markKeywords(text: string, words: readonly string[]): MarkedPart[] {
  const { folded, origin } = fold(text)
  const hit = new Array<boolean>(text.length).fill(false)
  for (const word of words) {
    for (let at = folded.indexOf(word); at !== -1; at = folded.indexOf(word, at + 1)) {
      for (let unit = origin[at]; unit < origin[at + word.length]; unit++) hit[unit] = true
    }
  }
  const parts: MarkedPart[] = []
  for (let start = 0; start < text.length; ) {
    let end = start
    while (end < text.length && hit[end] === hit[start]) end++
    parts.push({ text: text.slice(start, end), hit: hit[start] })
    start = end
  }
  return joinAcrossBreaks(parts)
}

function isBreakOnly(text: string): boolean {
  return text.replace(wordBreakRun, '') === ''
}

function isBridge(parts: readonly MarkedPart[], index: number): boolean {
  const part = parts[index]
  return !part.hit && isBreakOnly(part.text) && parts[index - 1]?.hit === true && parts[index + 1]?.hit === true
}

/** Two marked words with only a `〜` or a space between them read as one match: the gap is marked with them. */
function joinAcrossBreaks(parts: readonly MarkedPart[]): MarkedPart[] {
  const joined: MarkedPart[] = []
  parts.forEach((part, index) => {
    const hit = part.hit || isBridge(parts, index)
    const last = joined.at(-1)
    if (last?.hit === hit) last.text += part.text
    else joined.push({ text: part.text, hit })
  })
  return joined
}
