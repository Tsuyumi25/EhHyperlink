import { describe, expect, it } from 'vitest'
import { markKeywords, matchWords } from './highlight'

const marked = (text: string, keywords: string[]): string =>
  markKeywords(text, matchWords(keywords))
    .map((part) => (part.hit ? `[${part.text}]` : part.text))
    .join('')

describe('markKeywords', () => {
  it('marks every occurrence of a keyword', () => {
    expect(marked('作品乙 第2話 | 作品乙 総集編', ['作品乙'])).toBe('[作品乙] 第2話 | [作品乙] 総集編')
  })

  // Stores and Google write the same name in other widths and cases than the
  // title does; the mark falls on the result's own characters.
  it('matches across full-width, half-width and letter case', () => {
    expect(marked('ＣＩＲＣＬＥ alpha の新刊', ['Circle Alpha'])).toBe('[ＣＩＲＣＬＥ alpha] の新刊')
    expect(marked('ｻｰｸﾙ甲', ['サークル甲'])).toBe('[ｻｰｸﾙ甲]')
  })

  // A keyword written with spaces also marks its words apart, as a search
  // engine matches them; a one-letter word would mark nearly every line.
  it('marks the words of a spaced keyword but not single letters', () => {
    expect(marked('Alpha works by Circle', ['Circle Alpha'])).toBe('[Alpha] works by [Circle]')
    expect(marked('a cat', ['Work a'])).toBe('a cat')
  })

  // Sites drop or swap a title's decoration; the words between it still
  // match, and a gap of punctuation between two of them is marked with them.
  it('matches a keyword whose decoration the result writes differently', () => {
    expect(marked('作品甲〜副題乙丙 | DLsite', ['作品甲〜副題乙丙〜'])).toBe('[作品甲〜副題乙丙] | DLsite')
    expect(marked('作品甲 副題乙丙の続き', ['作品甲〜副題乙丙〜'])).toBe('[作品甲 副題乙丙]の続き')
  })

  it('merges overlapping matches into one run', () => {
    expect(marked('作品乙丙', ['作品乙', '乙丙'])).toBe('[作品乙丙]')
  })

  // A result without any keyword stays one unmarked run.
  it('leaves unmatched text whole', () => {
    expect(markKeywords('作品丁', matchWords(['作品乙']))).toEqual([{ text: '作品丁', hit: false }])
  })
})
