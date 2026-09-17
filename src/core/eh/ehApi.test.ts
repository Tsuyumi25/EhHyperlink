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
      tags: ['language:spanish', 'artist:artistalpha.'],
    })
    expect(entries[1]).toMatchObject({ titleJpn: '', category: '', tags: [] })
  })

  it('returns nothing for a body without gmetadata', () => {
    expect(parseMetadataResponse({ error: 'Invalid request' })).toEqual([])
    expect(parseMetadataResponse(null)).toEqual([])
  })
})
