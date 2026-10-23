import { describe, expect, it } from 'vitest'
import { SEARCH_SITES } from './sites'
import type { TermKind } from './terms'

function urlOf(id: string, kind: TermKind, text = 'Circle Alpha'): string {
  const site = SEARCH_SITES.find((candidate) => candidate.id === id)
  if (!site) throw new Error(`no site ${id}`)
  return site.url({ kind, text })
}

describe('SEARCH_SITES', () => {
  // A work title searched among users or fan clubs finds nobody, and a store that files
  // makers and authors under their own field misses them in a title search;
  // the sites that keep these apart get the search that matches the term.
  it('sends works and creators to the matching search', () => {
    expect(urlOf('pixiv', 'work')).toBe('https://www.pixiv.net/search?q=Circle%20Alpha&s_mode=tag_tc&type=artwork&r=1')
    expect(urlOf('pixiv', 'artist')).toBe('https://www.pixiv.net/search/users?nick=Circle%20Alpha&s_mode=s_usr')
    expect(urlOf('fantia', 'work')).toBe('https://fantia.jp/products?keyword=Circle%20Alpha')
    expect(urlOf('fantia', 'circle')).toBe('https://fantia.jp/fanclubs?keyword=Circle%20Alpha')
    expect(urlOf('melonbooks', 'circle')).toBe('https://www.melonbooks.co.jp/search/search.php?name=Circle%20Alpha&text_type=maker')
  })

  // Every term row lists the same sites, so no site may depend on a term the
  // gallery did not yield.
  it('builds a URL for every site and every kind', () => {
    for (const kind of ['work', 'circle', 'artist'] as const) {
      for (const site of SEARCH_SITES) expect(site.url({ kind, text: '作品乙' })).toMatch(/^https:\/\//)
    }
  })
})
