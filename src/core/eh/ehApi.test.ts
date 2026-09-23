import { describe, expect, it } from 'vitest'
import { parseMetadataResponse } from './ehApi'
import { RequestError } from './request'

// Invented galleries; the response shape follows https://ehwiki.org/wiki/API.

describe('gallery metadata response', () => {
  it('keeps well-formed entries and drops errored or malformed ones', () => {
    const entries = parseMetadataResponse({
      gmetadata: [
        { gid: 1001, token: '0a0a0a0a0a', title: '[Artistalpha.] Work Beta [Spanish]', title_jpn: '[作者甲] 作品乙 [スペイン翻訳]', category: 'Doujinshi', tags: ['language:spanish', 'artist:artistalpha.'] },
        { gid: 1002, error: 'Key missing, or incorrect key provided.' },
        { gid: 'not-a-gid', title: 'x' },
        { gid: 1003, title: 'Bare', tags: undefined },
      ],
    })
    expect(entries.map((entry) => entry.gid)).toEqual([1001, 1003])
    expect(entries[0]).toEqual({
      gid: 1001,
      title: '[Artistalpha.] Work Beta [Spanish]',
      titleJpn: '[作者甲] 作品乙 [スペイン翻訳]',
      category: 'Doujinshi',
      posted: null,
      thumb: '',
      rating: null,
      tags: ['language:spanish', 'artist:artistalpha.'],
    })
    expect(entries[1]).toMatchObject({ titleJpn: '', category: '', tags: [] })
  })

  it('reads the posted date the API sends as a decimal string', () => {
    const entries = parseMetadataResponse({
      gmetadata: [
        { gid: 2001, title: 'Work Beta', posted: '1277193600' },
        { gid: 2002, title: 'Work Gamma', posted: 1277193601 },
        { gid: 2003, title: 'Work Delta', posted: 'not a date' },
      ],
    })
    expect(entries.map((entry) => entry.posted)).toEqual([1277193600, 1277193601, null])
  })

  it('reads the cover URL and drops a rating of zero as unrated', () => {
    const entries = parseMetadataResponse({
      gmetadata: [
        { gid: 3001, title: 'Work Beta', thumb: 'https://example.invalid/cover.jpg', rating: '4.71' },
        { gid: 3002, title: 'Work Gamma', rating: '0.00' },
        { gid: 3003, title: 'Work Delta', thumb: 42, rating: 'unrated' },
      ],
    })
    expect(entries.map((entry) => entry.thumb)).toEqual(['https://example.invalid/cover.jpg', '', ''])
    expect(entries.map((entry) => entry.rating)).toEqual([4.71, null, null])
  })

  it('rejects a protocol error rather than treating it as empty metadata', () => {
    expect(() => parseMetadataResponse({ error: 'Invalid request' })).toThrow(RequestError)
    expect(() => parseMetadataResponse(null)).toThrow(RequestError)
    expect(parseMetadataResponse({ gmetadata: [] })).toEqual([])
  })

  it('isolates invalid optional fields and prevents out-of-range ratings reaching rendering', () => {
    const entries = parseMetadataResponse({
      gmetadata: [
        { gid: 4001, title: 'Work Alpha', tags: [17] },
        { gid: 4002, title: 'Work Beta', title_jpn: 17 },
        { gid: 4003, title: 'Work Gamma', category: [] },
        { gid: 4004, title: 'Work Delta', rating: 6 },
        { gid: 4005, title: 'Work Epsilon', rating: 5, tags: [] },
      ],
    })
    expect(entries.map((entry) => [entry.gid, entry.rating])).toEqual([[4004, null], [4005, 5]])
  })

  it('decodes the HTML entities the API escapes, so both routes read one title', () => {
    const entries = parseMetadataResponse({
      gmetadata: [
        {
          gid: 1004,
          token: '0a0a0a0a0a',
          title: '[Circle Alpha] Work Beta [Chinese] [Alpha Scans&amp;Beta Scans] &#039;Revised&#039;',
          title_jpn: '[圓環甲] &quot;作品乙&quot; [中国翻訳]',
        },
      ],
    })
    expect(entries[0].title).toBe("[Circle Alpha] Work Beta [Chinese] [Alpha Scans&Beta Scans] 'Revised'")
    expect(entries[0].titleJpn).toBe('[圓環甲] "作品乙" [中国翻訳]')
  })
})
