import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseSearchResults, searchUrl } from './ehSearch'

const compact = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'search-compact.html'), 'utf-8')

describe('search result parsing', () => {
  it('reads gid, title, tags, pages, category and torrent link from compact rows', () => {
    const hits = parseSearchResults(compact)
    expect(hits.map((hit) => hit.gid)).toEqual([1001, 1002])
    expect(hits[0]).toMatchObject({
      href: 'https://e-hentai.org/g/1001/0a0a0a0a0a/',
      title: '[Artistalpha.] Work Beta [Spanish] [Some Scans]',
      category: 'Doujinshi',
      pages: 18,
      torrentHref: null,
    })
    expect(hits[0].tags).toEqual(['language:spanish', 'language:translated', 'parody:original', 'artist:artistalpha.'])
    expect(hits[1]).toMatchObject({ pages: 6, torrentHref: 'https://e-hentai.org/gallerytorrents.php?gid=1002&t=0b0b0b0b0b' })
  })

  it('returns no hits for a page without a result table', () => {
    expect(parseSearchResults('<html><body><p>No hits found</p></body></html>')).toEqual([])
  })

  it('qualifies the phrase with title: and appends the creator scope', () => {
    expect(searchUrl('https://e-hentai.org', 'Work Beta')).toBe('https://e-hentai.org/?f_search=title%3A%22Work%20Beta%22')
    const scoped = searchUrl('https://e-hentai.org', 'Work Beta', 'a:"artist alpha$"')
    expect(new URL(scoped).searchParams.get('f_search')).toBe('title:"Work Beta" a:"artist alpha$"')
  })
})
