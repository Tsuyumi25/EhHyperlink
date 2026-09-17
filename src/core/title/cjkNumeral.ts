/**
 * Chinese / Japanese numerals as they appear in chapter and volume counters:
 * `第三話`, `第十二巻`, `第一百零二话`, `弐`, `廿二`.
 *
 * Scope is deliberately small: values 0–999, the forms a counter can take. Edge
 * cases follow cn2an (Ailln/cn2an, MIT) where the two languages agree; where they
 * differ the Japanese reading wins because most titles carry a Japanese field:
 *   十      = 10      一十一 / 十一 = 11      二十三 = 23      廿二 = 22
 *   百      = 100     一百零二     = 102     百二   = 102 (JP; colloquial CN 一百二 = 120 is not honoured)
 *   一〇二  = 102 (positional, digits only)
 * Anything with 千 or above, mixed orders (十百), or repeated units returns null.
 */

const DIGIT_VALUES: Record<string, number> = {
  '〇': 0, '零': 0,
  '一': 1, '壱': 1, '壹': 1,
  '二': 2, '弐': 2, '貳': 2, '贰': 2, '两': 2, '兩': 2,
  '三': 3, '参': 3, '參': 3, '叁': 3,
  '四': 4, '肆': 4,
  '五': 5, '伍': 5,
  '六': 6, '陸': 6, '陆': 6,
  '七': 7, '柒': 7,
  '八': 8, '捌': 8,
  '九': 9, '玖': 9,
}

/** Units and the value they multiply; 廿 / 卅 are whole tens on their own. */
const UNIT_VALUES: Record<string, number> = { '十': 10, '拾': 10, '百': 100, '佰': 100 }
const FIXED_TENS: Record<string, number> = { '廿': 20, '卅': 30 }

/** Every character a counter may contain, for building character classes. */
export const CJK_NUMERAL_CHARACTERS = [...Object.keys(DIGIT_VALUES), ...Object.keys(UNIT_VALUES), ...Object.keys(FIXED_TENS)].join('')

function positionalValue(characters: string[]): number | null {
  if (characters.length > 3) return null
  let value = 0
  for (const character of characters) value = value * 10 + DIGIT_VALUES[character]
  return value
}

/** Numeric value of a counter written in CJK numerals, or null when it is not one. */
export function parseCjkNumeral(text: string): number | null {
  const characters = [...text]
  if (characters.length === 0) return null
  if (characters.every((character) => character in DIGIT_VALUES)) return positionalValue(characters)

  let value = 0
  let pendingDigit: number | null = null
  let lastUnit = Infinity

  for (const character of characters) {
    if (character in DIGIT_VALUES) {
      // `零` is a filler between units (`一百零二`); any other digit run means garbage.
      if (pendingDigit !== null && pendingDigit !== 0) return null
      pendingDigit = DIGIT_VALUES[character]
      continue
    }
    const fixedTen = FIXED_TENS[character]
    if (fixedTen !== undefined) {
      if (pendingDigit !== null || lastUnit <= 10) return null
      value += fixedTen
      lastUnit = 10
      continue
    }
    const unit = UNIT_VALUES[character]
    if (unit === undefined || unit >= lastUnit) return null
    value += (pendingDigit === null || pendingDigit === 0 ? 1 : pendingDigit) * unit
    pendingDigit = null
    lastUnit = unit
  }

  if (pendingDigit !== null) value += pendingDigit
  return value
}
