import { describe, expect, it } from 'vitest'
import type { SourceGallery } from '../eh/galleryPage'
import { searchRecipe } from './recipe'

function gallery(titleJpn: string): SourceGallery {
  return { gid: 1, title: '', titleJpn, category: 'Doujinshi', tags: [] }
}

describe('searchRecipe', () => {
  // Google gets the whole title without event and language tags, once open
  // and once kept to `.jp` sites, and DuckDuckGo the same; DLsite and
  // pixiv get each term, pixiv splitting works (artwork search) from creators
  // (user search).
  it('runs the title on Google and each term on DLsite and pixiv', () => {
    const recipe = searchRecipe(gallery('(C104) [サークル甲 (作家乙)] 作品乙 [中国翻訳]'))
    expect(recipe.map((search) => [search.site, search.kind, search.text])).toEqual([
      ['google', 'title', '[サークル甲 (作家乙)] 作品乙'],
      ['googleJp', 'title', '[サークル甲 (作家乙)] 作品乙 site:*.jp'],
      ['duckduckgo', 'title', '[サークル甲 (作家乙)] 作品乙'],
      ['dlsite', 'work', '作品乙'],
      ['dlsite', 'circle', 'サークル甲'],
      ['dlsite', 'artist', '作家乙'],
      ['pixiv', 'work', '作品乙'],
      ['pixiv', 'circle', 'サークル甲'],
      ['pixiv', 'artist', '作家乙'],
    ])
    expect(recipe.find((search) => search.site === 'pixiv' && search.kind === 'artist')?.url).toContain('/search/users?nick=')
    expect(recipe.find((search) => search.site === 'pixiv' && search.kind === 'work')?.url).toContain('s_mode=tag_tc')
  })

  // A solo circle names one person as circle and artist; on a site whose
  // search does not tell them apart, that is one search, not two.
  it('runs one search where two terms lead to the same URL', () => {
    const recipe = searchRecipe(gallery('[Circle Alpha (Circle Alpha)] Work Beta'))
    expect(recipe.filter((search) => search.site === 'dlsite').map((search) => search.text)).toEqual(['Work Beta', 'Circle Alpha'])
  })
})
