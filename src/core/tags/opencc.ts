/**
 * Simplified → Traditional (Taiwan) conversion with OpenCC's own dictionary
 * files, fetched at run time instead of bundled. The chain follows OpenCC's
 * `s2tw` plus its Taiwan phrases, without `STPhrases`: that table is 1 MB and
 * only settles characters with several Traditional forms, which the short tag
 * names here rarely need; such a character takes its first form.
 */
export interface OpenccDictionary {
  entries: ReadonlyMap<string, string>
  /** the longest key, in code points */
  longest: number
}

const COMMENT = '#'
const KEY_SEPARATOR = '\t'
const VALUE_SEPARATOR = ' '

/** One OpenCC `.txt` dictionary: `key<TAB>value value…` per line; the first value is the one used. */
export function parseOpenccDictionary(text: string): OpenccDictionary {
  const entries = new Map<string, string>()
  let longest = 0
  for (const line of text.split('\n')) {
    if (!line || line.startsWith(COMMENT)) continue
    const [key, values] = line.split(KEY_SEPARATOR)
    const value = values?.trim().split(VALUE_SEPARATOR)[0]
    if (!key || !value) continue
    entries.set(key, value)
    longest = Math.max(longest, [...key].length)
  }
  return { entries, longest }
}

/** `text` through one dictionary, longest match first; what no key covers stays as it is. */
export function convertWith(text: string, dictionary: OpenccDictionary): string {
  const characters = [...text]
  let out = ''
  for (let at = 0; at < characters.length; ) {
    let matched = false
    for (let length = Math.min(dictionary.longest, characters.length - at); length > 0; length--) {
      const value = dictionary.entries.get(characters.slice(at, at + length).join(''))
      if (value === undefined) continue
      out += value
      at += length
      matched = true
      break
    }
    if (!matched) {
      out += characters[at]
      at += 1
    }
  }
  return out
}

/** `text` through each dictionary in turn, as OpenCC chains its conversion steps. */
export function convertChain(text: string, chain: readonly OpenccDictionary[]): string {
  return chain.reduce((converted, dictionary) => convertWith(converted, dictionary), text)
}
