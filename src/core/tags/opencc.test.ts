import { describe, expect, it } from 'vitest'
import { convertChain, convertWith, parseOpenccDictionary } from './opencc'

const CHARACTERS = parseOpenccDictionary('# comment\n长\t長\n筒\t筒\n袜\t襪\n软\t軟\n件\t件\n发\t發 髮\n\n')
const TW_PHRASES = parseOpenccDictionary('軟件\t軟體\n')
const TW_VARIANTS = parseOpenccDictionary('裏\t裡\n')

describe('parseOpenccDictionary', () => {
  // A character with several Traditional forms takes the first one listed.
  it('reads the first value of each line and skips comments and blank lines', () => {
    expect(CHARACTERS.entries.get('发')).toBe('發')
    expect(CHARACTERS.entries.size).toBe(6)
    expect(TW_PHRASES.longest).toBe(2)
  })
})

describe('convertWith', () => {
  it('converts character by character and leaves unknown text alone', () => {
    expect(convertWith('长筒袜 stockings', CHARACTERS)).toBe('長筒襪 stockings')
  })

  // A phrase wins over its characters taken one by one.
  it('takes the longest key first', () => {
    const dictionary = parseOpenccDictionary('软\tX\n软件\tY\n')
    expect(convertWith('软件软', dictionary)).toBe('YX')
  })
})

describe('convertChain', () => {
  // OpenCC's Taiwan conversion: characters first, then Taiwan's wording on the Traditional result.
  it('runs each step on the previous step\'s output', () => {
    expect(convertChain('软件', [CHARACTERS, TW_PHRASES, TW_VARIANTS])).toBe('軟體')
    expect(convertChain('裏', [CHARACTERS, TW_PHRASES, TW_VARIANTS])).toBe('裡')
  })
})
