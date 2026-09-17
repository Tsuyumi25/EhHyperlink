import { describe, expect, it } from 'vitest'
import { parseCjkNumeral } from './cjkNumeral'

describe('CJK numerals', () => {
  it('reads unit forms the way both languages agree on', () => {
    const cases: Array<[string, number]> = [
      ['零', 0],
      ['一', 1],
      ['十', 10],
      ['十一', 11],
      ['一十一', 11],
      ['二十', 20],
      ['二十三', 23],
      ['一百', 100],
      ['一百零一', 101],
      ['一百一十', 110],
      ['一百一十一', 111],
      ['廿二', 22],
      ['卅', 30],
    ]
    for (const [text, value] of cases) expect(parseCjkNumeral(text), text).toBe(value)
  })

  it('reads positional digit runs, daiji and variant digits', () => {
    expect(parseCjkNumeral('一〇二')).toBe(102)
    expect(parseCjkNumeral('一二三')).toBe(123)
    expect(parseCjkNumeral('弐')).toBe(2)
    expect(parseCjkNumeral('壹拾壹')).toBe(11)
    expect(parseCjkNumeral('参')).toBe(3)
    expect(parseCjkNumeral('兩')).toBe(2)
  })

  it('takes the Japanese reading where the languages differ', () => {
    expect(parseCjkNumeral('百二')).toBe(102)
    expect(parseCjkNumeral('一百二')).toBe(102)
  })

  it('rejects runs that are not a counter', () => {
    for (const text of ['', '十十', '十百', '千', '一二三四', '二廿', '一百二十三十']) expect(parseCjkNumeral(text), text).toBeNull()
  })
})
