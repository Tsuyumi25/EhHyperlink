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

  it('returns no hits when the response contains no gallery rows', () => {
    expect(parseSearchResults('<html><body><p>Temporarily unavailable</p></body></html>')).toEqual([])
  })

  it('accepts a valid empty search page without a result table', () => {
    expect(parseSearchResults('<div id="toppane"><div id="searchbox"><input name="f_search"></div></div><div><p>No hits found</p></div>')).toEqual([])
  })

  it('sends the query as the planner wrote it instead of qualifying a bare phrase', () => {
    const url = new URL(searchUrl('https://e-hentai.org', 'title:"Work Beta" a:"artist alpha$"'))
    expect(url.searchParams.get('f_search')).toBe('title:"Work Beta" a:"artist alpha$"')
    const tagQuery = new URL(searchUrl('https://e-hentai.org', 'cosplayer:"name alpha$" other:"realporn$"'))
    expect(tagQuery.searchParams.get('f_search')).toBe('cosplayer:"name alpha$" other:"realporn$"')
  })

  it('asks for expunged galleries only in the expunged visibility, and for every category in both', () => {
    const published = new URL(searchUrl('https://exhentai.org', 'title:"Work Beta"'))
    expect(published.searchParams.get('f_sh')).toBeNull()
    expect(published.searchParams.get('f_cats')).toBe('0')
    const expunged = new URL(searchUrl('https://exhentai.org', 'title:"Work Beta"', 'expunged'))
    expect(expunged.searchParams.get('f_sh')).toBe('on')
    expect(expunged.searchParams.get('f_cats')).toBe('0')
  })
})
