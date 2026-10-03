import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseSearchResults, searchUrl } from './ehSearch'

const compact = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'search-compact.html'), 'utf-8')
const extended = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'search-extended.html'), 'utf-8')

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

  it('reads complete metadata from Extended rows, including weak tags and deferred covers', () => {
    const hits = parseSearchResults(extended)
    expect(hits).toEqual([
      {
        gid: 1001,
        token: '0a0a0a0a0a',
        href: 'https://e-hentai.org/g/1001/0a0a0a0a0a/',
        title: '[Artistalpha.] Work Beta [Spanish] [Some Scans]',
        titleJpn: '',
        category: 'Doujinshi',
        tags: ['artist:artist_alpha', 'parody:parody_alpha', 'character:character_alpha'],
        pages: 18,
        posted: Date.UTC(2023, 10, 19, 2, 18) / 1000,
        thumb: 'https://example.invalid/cover-alpha.jpg',
        rating: 4,
        torrentHref: null,
      },
      {
        gid: 1002,
        token: '0b0b0b0b0b',
        href: 'https://e-hentai.org/g/1002/0b0b0b0b0b/',
        title: '[Pixiv] [Artistalpha] Work Beta [Chinese]',
        titleJpn: '',
        category: 'Doujinshi',
        tags: ['artist:artist_alpha'],
        pages: 6,
        posted: Date.UTC(2022, 9, 1, 12) / 1000,
        thumb: 'https://example.invalid/cover-beta.jpg',
        rating: 4.5,
        torrentHref: 'https://e-hentai.org/gallerytorrents.php?gid=1002&t=0b0b0b0b0b',
      },
    ])
  })

  it('decodes HTML entities in fetched titles', () => {
    const html = extended.replace('Work Beta [Spanish]', 'Work Beta &amp; &quot;Gamma&quot; [Spanish]')
    expect(parseSearchResults(html)[0].title).toBe('[Artistalpha.] Work Beta & "Gamma" [Spanish] [Some Scans]')
  })

  it.each([
    ['0px -1px', 5],
    ['-64px -21px', 0.5],
    ['-80px -1px', null],
    ['-96px -1px', null],
    ['16px -1px', null],
    ['-8px -1px', null],
    ['-16px -11px', null],
    ['0% 0%', null],
    ['', null],
  ])('reads the displayed rating at %s as %s', (position, expected) => {
    const page = new DOMParser().parseFromString(extended, 'text/html')
    page.querySelector<HTMLElement>('.ir')!.style.backgroundPosition = position
    expect(parseSearchResults(page.documentElement.outerHTML)[0].rating).toBe(expected)
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

  it('requests Extended in both visibility modes while preserving category and expunged filters', () => {
    const published = new URL(searchUrl('https://exhentai.org', 'title:"Work Beta"'))
    expect(published.searchParams.get('f_sh')).toBeNull()
    expect(published.searchParams.get('f_cats')).toBe('0')
    expect(published.searchParams.get('inline_set')).toBe('dm_e')
    const expunged = new URL(searchUrl('https://exhentai.org', 'title:"Work Beta"', 'expunged'))
    expect(expunged.searchParams.get('f_sh')).toBe('on')
    expect(expunged.searchParams.get('f_cats')).toBe('0')
    expect(expunged.searchParams.get('inline_set')).toBe('dm_e')
  })
})
