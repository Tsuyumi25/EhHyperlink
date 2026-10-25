import { describe, expect, it } from 'vitest'
import { detectLocale, resolveLocale } from './locale'

describe('detectLocale', () => {
  it('uses the first supported language in browser preference order', () => {
    expect(detectLocale(['fr-FR', 'ja-JP', 'zh-TW'])).toBe('ja')
    expect(detectLocale(['ko-KR', 'en-US'])).toBe('ko')
    expect(detectLocale(['en-GB', 'zh-TW'])).toBe('en')
  })

  // The script says which characters the reader reads; the region only guesses it.
  it('prefers an explicit Chinese script over the region', () => {
    expect(detectLocale(['zh-Hans-TW'])).toBe('zh-CN')
    expect(detectLocale(['zh-Hant-CN'])).toBe('zh-TW')
  })

  it('reads Traditional regions as Traditional and bare Chinese as Simplified', () => {
    expect(detectLocale(['zh-TW'])).toBe('zh-TW')
    expect(detectLocale(['zh-HK'])).toBe('zh-TW')
    expect(detectLocale(['zh-MO'])).toBe('zh-TW')
    expect(detectLocale(['zh-CN'])).toBe('zh-CN')
    expect(detectLocale(['zh'])).toBe('zh-CN')
  })

  it('falls back to English when no preference is supported', () => {
    expect(detectLocale(['fr-FR', 'de-DE'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })
})

describe('resolveLocale', () => {
  // A picked language wins over the browser; `auto` follows it.
  it('follows the browser only on auto', () => {
    expect(resolveLocale('ko', ['ja-JP'])).toBe('ko')
    expect(resolveLocale('auto', ['ja-JP'])).toBe('ja')
  })
})
