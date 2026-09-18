import { describe, expect, it } from 'vitest'
import { stripChapterMarkers } from '../title/chapter'
import type { SourceGallery } from '../eh/galleryPage'
import { creatorScope, editionTermsOf, planSearch } from './searchPlan'

// Every title below is invented.

const source: SourceGallery = {
  gid: 1000,
  title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
  titleJpn: '',
  category: 'Doujinshi',
  tags: ['artist:artistalpha'],
}

describe('chapter markers', () => {
  it('drops ehwiki chapter and volume forms wherever they sit', () => {
    expect(stripChapterMarkers('Work Gamma Ch. 1-7')).toBe('Work Gamma')
    expect(stripChapterMarkers('作品丙 第1-7話')).toBe('作品丙')
    expect(stripChapterMarkers('Work Gamma Vol. 8')).toBe('Work Gamma')
    expect(stripChapterMarkers('作品丙 第8巻')).toBe('作品丙')
    expect(stripChapterMarkers('Work Gamma Ch.3')).toBe('Work Gamma')
    expect(stripChapterMarkers('Chapter 3 Alpha Beta')).toBe('Alpha Beta')
  })

  it('drops a bare trailing series number only, decimals included', () => {
    expect(stripChapterMarkers('作品丁を教えて! 5')).toBe('作品丁を教えて!')
    expect(stripChapterMarkers('Alpha x Beta x Gamma 3')).toBe('Alpha x Beta x Gamma')
    expect(stripChapterMarkers('Alpha x Beta x Gamma 4.5')).toBe('Alpha x Beta x Gamma')
    expect(stripChapterMarkers('作品丁のほん5')).toBe('作品丁のほん')
    expect(stripChapterMarkers('作品丁本子5')).toBe('作品丁本子')
    expect(stripChapterMarkers('Alpha5')).toBe('Alpha5')
    expect(stripChapterMarkers('唯一')).toBe('唯一')
    expect(stripChapterMarkers('Work Delta 2.0')).toBe('Work Delta')
    expect(stripChapterMarkers('Work Gamma Ch. 4.5')).toBe('Work Gamma')
    expect(stripChapterMarkers('作品丙 第4.5話')).toBe('作品丙')
    expect(stripChapterMarkers('Volume Trader')).toBe('Volume Trader')
    expect(stripChapterMarkers('Route 2024')).toBe('Route 2024')
    expect(stripChapterMarkers('Version 1.2.3')).toBe('Version 1.2.3')
    expect(stripChapterMarkers('7')).toBe('7')
  })
  it('reads CJK numeral counters and leaves non-numeral kanji runs alone', () => {
    expect(stripChapterMarkers('作品丙 第三話')).toBe('作品丙')
    expect(stripChapterMarkers('作品丙 第十二巻')).toBe('作品丙')
    expect(stripChapterMarkers('作品丙 第一百零二话')).toBe('作品丙')
    expect(stripChapterMarkers('作品丙 弐')).toBe('作品丙')
    expect(stripChapterMarkers('作品丙 十十')).toBe('作品丙 十十')
    expect(stripChapterMarkers('第三話')).toBe('')
  })

  it('drops a trailing roman counter but keeps X forms', () => {
    expect(stripChapterMarkers('Work Gamma II')).toBe('Work Gamma')
    expect(stripChapterMarkers('Work Gamma iv')).toBe('Work Gamma')
    expect(planSearch({ ...source, title: '[作者甲] 作品丙 Ⅲ' }).editionTerms).toEqual(['作品丙'])
    expect(stripChapterMarkers('Work Gamma X')).toBe('Work Gamma X')
    expect(stripChapterMarkers('Work Gamma XXX')).toBe('Work Gamma XXX')
    expect(stripChapterMarkers('Work Gammavii')).toBe('Work Gammavii')
  })

  it('drops a trailing sequel or edition word but not a subtitle', () => {
    expect(stripChapterMarkers('作品丙 後編')).toBe('作品丙')
    expect(stripChapterMarkers('作品丙 上巻')).toBe('作品丙')
    expect(stripChapterMarkers('作品丙 総集編')).toBe('作品丙')
    expect(stripChapterMarkers('作品丙 花')).toBe('作品丙 花')
    expect(stripChapterMarkers('作品丙後編')).toBe('作品丙後編')
  })
})

describe('search planning', () => {
  it('searches each title field by its written work text', () => {
    const plan = planSearch({ ...source, titleJpn: '[作者甲] 作品乙' })
    expect(plan.editionTerms).toEqual(['Work Beta', '作品乙'])
    expect(plan.containerTerms).toEqual([])
  })

  it('skips digit-only and duplicate work text', () => {
    const plan = planSearch({ ...source, title: '[Artist] 2 (Parody)', titleJpn: '[作者] 2' })
    expect(plan.editionTerms).toEqual([])
  })

  it('searches each side of a translated-title bar minus its chapter marker', () => {
    expect(editionTermsOf('Work Beta 2 | Work Beta Translated Ch. 2')).toEqual(['Work Beta', 'Work Beta Translated'])
    const plan = planSearch({
      ...source,
      category: 'Manga',
      title: '[Artist Alpha] Work Gamma Ch. 1-7 [Korean] [Some Team]',
      titleJpn: '[作者甲] 作品丙 第1-7話 [韓国翻訳]',
    })
    expect(plan.editionTerms).toEqual(['Work Gamma', '作品丙'])
  })
})

describe('creator scope', () => {
  it('narrows to any listed creator, with the OR marker only for two or more', () => {
    expect(creatorScope(['female:x'])).toBe('')
    expect(creatorScope(['artist:artist_alpha', 'female:x'])).toBe('a:"artist alpha$"')
    expect(creatorScope(['group:circle_alpha', 'artist:artist_alpha', 'artist:artist_beta'])).toBe('~g:"circle alpha$" ~a:"artist alpha$" ~a:"artist beta$"')
  })

  it('is attached to every phrase the plan searches', () => {
    const plan = planSearch({ ...source, tags: ['artist:artist_alpha'] })
    expect(plan.scope).toBe('a:"artist alpha$"')
    expect(planSearch({ ...source, tags: [] }).scope).toBe('')
  })
})
