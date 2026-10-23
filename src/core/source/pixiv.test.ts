import { describe, expect, it } from 'vitest'
import { pixivApiUrl, pixivPageUrl, pixivSearchOf, readPixivResults } from './pixiv'

const ARTWORKS = new URL('https://www.pixiv.net/search?q=%E4%BD%9C%E5%93%81%E4%B9%99&s_mode=tag_tc&type=artwork&r=1')
const USERS = new URL('https://www.pixiv.net/search/users?nick=Circle%20Alpha&s_mode=s_usr')

describe('pixivApiUrl', () => {
  // The page and the API spell the search mode differently; `tag_tc` on the
  // page is `s_tag_tc` in the request, and the page number starts at 1.
  it('turns an artwork search page into its API request', () => {
    const api = new URL(pixivApiUrl(ARTWORKS) as string)
    expect(api.pathname).toBe('/ajax/search/artworks/%E4%BD%9C%E5%93%81%E4%B9%99')
    expect(api.searchParams.get('word')).toBe('作品乙')
    expect(api.searchParams.get('s_mode')).toBe('s_tag_tc')
    expect(api.searchParams.get('p')).toBe('1')
  })

  it('sends a user search to the mobile user search', () => {
    const api = new URL(pixivApiUrl(new URL(pixivPageUrl(USERS.href, 1))) as string)
    expect(api.pathname).toBe('/touch/ajax/search/users')
    expect(api.searchParams.get('nick')).toBe('Circle Alpha')
    expect(api.searchParams.get('p')).toBe('2')
  })

  // English readers get the same search under `/en/`.
  it('reads the search under /en/ the same way', () => {
    const english = new URL(ARTWORKS.href.replace('pixiv.net/', 'pixiv.net/en/'))
    expect(pixivSearchOf(english)).toEqual(pixivSearchOf(ARTWORKS))
  })

  it('reads nothing off pages that are not a search', () => {
    expect(pixivSearchOf(new URL('https://www.pixiv.net/users/1'))).toBeNull()
    expect(pixivSearchOf(new URL('https://www.example.com/search?q=x'))).toBeNull()
  })
})

describe('pixivPageUrl', () => {
  // Two pages of one search are two requests.
  it('pages through one search with p', () => {
    const second = new URL(pixivPageUrl(ARTWORKS.href, 1))
    expect(second.searchParams.get('p')).toBe('2')
    expect(pixivSearchOf(second)?.key).not.toBe(pixivSearchOf(ARTWORKS)?.key)
  })
})

describe('readPixivResults', () => {
  // Artworks sit in body.illustManga.data, where an ad slot is an entry
  // without an id.
  it('reads artworks and skips ad slots', () => {
    const json = {
      error: false,
      body: { illustManga: { data: [{ id: '100', title: '作品乙', userName: '作家乙', createDate: '2026-01-02T03:04:05+09:00' }, { isAdContainer: true }] } },
    }
    expect(readPixivResults(json, ARTWORKS)).toEqual({
      status: 'ok',
      results: [{ title: '作品乙', href: 'https://www.pixiv.net/artworks/100', origin: 'https://www.pixiv.net', byline: '作家乙', snippet: '2026-01-02' }],
    })
  })

  it('reads users off a user search', () => {
    const json = { error: false, body: { users: [{ user_id: '7', user_name: 'Circle Alpha' }] } }
    expect(readPixivResults(json, USERS).results).toEqual([{ title: 'Circle Alpha', href: 'https://www.pixiv.net/users/7', origin: 'https://www.pixiv.net', byline: '', snippet: '' }])
  })

  // pixiv refusing the request is not the same as a search with no hits.
  it('tells a refused request from an empty search', () => {
    expect(readPixivResults({ error: true, message: 'x', body: [] }, ARTWORKS).status).toBe('unreadable')
    expect(readPixivResults({ error: false, body: { illustManga: { data: [] } } }, ARTWORKS).status).toBe('empty')
  })
})
