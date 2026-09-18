import { describe, expect, it } from 'vitest'
import { parseMetadataResponse } from './ehApi'

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

  it('returns nothing for a body without gmetadata', () => {
    expect(parseMetadataResponse({ error: 'Invalid request' })).toEqual([])
    expect(parseMetadataResponse(null)).toEqual([])
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
