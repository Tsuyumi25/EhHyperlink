import { anyOf, createRegExp, exactly, oneOrMore, type Input } from 'magic-regexp'

/**
 * Unicode-aware inputs for magic-regexp, and the only file that writes regex syntax.
 *
 * magic-regexp's own `letter` / `digit` / `whitespace` / `wordBoundary` are ASCII
 * (`[a-zA-Z]`, `\d`, `\s`, `\b`); this corpus is mostly kana and CJK, so rule
 * files take those names from here instead. `compile` always sets the `u` flag.
 */

/**
 * A verbatim fragment. magic-regexp escapes string inputs but interpolates Input
 * objects as-is, and does not export its `createInput`; feeding a minimal object
 * with `toString` through `exactly` is the supported way to obtain a full Input.
 */
function raw<S extends string>(source: S): Input<S> {
  const fragment = { toString: () => source } as unknown as Input<S>
  return exactly(fragment)
}

/** One character with the given Unicode general category or binary property: `L`, `Nd`, `White_Space`, … */
export function unicode<C extends string>(category: C): Input<`\\p{${C}}`> {
  return raw(`\\p{${category}}`)
}

export function notUnicode<C extends string>(category: C): Input<`\\P{${C}}`> {
  return raw(`\\P{${category}}`)
}

export const letter = unicode('L')
export const digit = unicode('Nd')
export const whitespace = unicode('White_Space')
/**
 * Han, hiragana or katakana, plus `ー`: the scripts that glue a counter to the
 * word before it (`ほん5`, `カラー9`). The prolonged sound mark is `Script=Common`
 * — it serves both kana — so `Script=Katakana` misses it, yet it ends words and
 * a counter after it is a counter.
 */
export const cjkLetter = raw('[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}ー]')
/**
 * Han alone, and kana alone. Corpus census: 239 distinct kana cover 17.6% of
 * every character position in 3.36M titles, 6,529 distinct han cover 11.0% —
 * one han character is 43x rarer than one kana on average, so a query built
 * from han lands on far fewer galleries.
 */
export const han = raw('[\\p{Script=Han}]')
export const kana = raw('[\\p{Script=Hiragana}\\p{Script=Katakana}ー]')
export const start = raw('^')
export const end = raw('$')
/**
 * Punctuation or symbol: never work text on its own, and editions in different
 * languages punctuate the same title differently (`〜を教えて!` against `！`).
 */
export const punctuation = raw('[\\p{P}\\p{S}]')

/** Zero or more whitespace characters. */
export const optionalSpace = whitespace.times.any()

/**
 * `input` as a whole token: no letter directly before it, no letter or digit
 * directly after. The Unicode stand-in for `\b`, which only knows ASCII word characters.
 */
export function standalone<S extends string>(input: Input<S>): Input<`(?<!\\p{L})${S}(?!(?:\\p{L}|\\p{Nd}))`> {
  return input.notAfter(letter).notBefore(anyOf(letter, digit))
}

type Flag = 'g' | 'i' | 'm' | 's' | 'y' | 'd'

/** Build the RegExp; `u` is always on. */
export function compile(input: Input<string>, flags: readonly Flag[] = []): RegExp {
  return createRegExp(input, [...flags, 'u'])
}

/** One or more whitespace characters; the usual `split` / `replace` argument. */
export const whitespaceRun = compile(oneOrMore(whitespace), ['g'])
