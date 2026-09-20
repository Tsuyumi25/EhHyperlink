import { describe, expect, it } from 'vitest'
import { matchContainers, matchExtractedChapters, planContainerSearch } from './container'
import type { SearchHit } from '../eh/ehSearch'
import type { SourceGallery } from '../eh/galleryPage'
import { planSearch } from './searchPlan'

// Every title below is invented.

function hit(gid: number, title: string, titleJpn = ''): SearchHit {
  return { gid, token: '0000000000', href: `https://e-hentai.org/g/${gid}/0000000000/`, title, titleJpn, category: 'Manga', tags: [], pages: null, posted: null, thumb: '', rating: null, torrentHref: null }
}

const manga: SourceGallery = { gid: 1000, title: '', titleJpn: '', category: 'Manga', tags: [] }
const hasLetters = (text: string) => [...text].some((character) => character.toLowerCase() !== character.toUpperCase() || character > '\u2e80')

describe('container planning', () => {
  it('adds a container search for a Manga chapter whose context names no parody', () => {
    const plan = planSearch({ ...manga, title: '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly 2010-02) [Thai ภาษาไทย] [Someone]', tags: ['artist:artist_alpha'] })
    expect(plan.containerTerms).toEqual(['COMIC Alphabeta Monthly 2010-02'])
    expect(plan.containerNames).toEqual(['comic alphabeta monthly 2010 02'])
    expect(plan.isContainerCandidate).toBe(false)
  })

  it('does not treat a tagged parody as a container, and ignores other categories', () => {
    expect(planSearch({ ...manga, title: '[Artist] Work Title (Series Beta) [English]', tags: ['parody:series_beta'] }).containerTerms).toEqual([])
    expect(planContainerSearch({ ...manga, category: 'Doujinshi', title: '[Artist] Work Title (Series Beta)' }, hasLetters, []).isContainerCandidate).toBe(false)
  })

  it('plans a Doujinshi anthology all the same: the tag says what the book is, not the category', () => {
    const doujin = { ...manga, category: 'Doujinshi', title: 'Work Beta -Gamma Delta- Vol. 24', tags: ['other:anthology'] }
    expect(planContainerSearch(doujin, hasLetters, []).chapterTerms).toEqual(['Work Beta -Gamma Delta- Vol. 24'])
    expect(planSearch(doujin).isContainerCandidate).toBe(true)
  })

  it('searches the container in both title fields and treats a context-free Manga as a container candidate', () => {
    const chapter = planSearch({ ...manga, title: '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18) [English]', titleJpn: '[作者甲] 作品乙 (コミック甲 Vol.18) [英訳]' })
    expect(chapter.containerTerms).toEqual(['COMIC Alphabeta Monthly Vol. 18', 'コミック甲 Vol.18'])
    const magazine = planSearch({ ...manga, title: 'COMIC Alphabeta Monthly Vol. 18', titleJpn: 'コミック甲 Vol.18' })
    expect(magazine.isContainerCandidate).toBe(true)
    expect(magazine.editionTerms).toEqual(['COMIC Alphabeta Monthly', 'コミック甲'])
    expect(magazine.chapterTerms).toEqual(['COMIC Alphabeta Monthly Vol. 18', 'コミック甲 Vol.18'])
  })
})

describe('container matching', () => {
  it('keeps only container hits whose work text, in either field, names the source block', () => {
    const kept = matchContainers(['comic alphabeta monthly 2010 02', 'コミック甲 2010 02'], [
      hit(1, 'COMIC Alphabeta Monthly 2010-02'),
      hit(2, 'COMIC Alphabeta Monthly 2010-02 Vol. 38 [Digital]'),
      hit(3, 'COMIC Alpha 2011-10'),
      hit(4, 'Alphabeta Monthly Magazine 2010-02', 'コミック甲 2010-02'),
    ])
    expect(kept.map((container) => container.gid)).toEqual([1, 2, 4])
  })

  it('lists chapters whose context names this exact issue, in either field', () => {
    const magazine: SourceGallery = { ...manga, title: 'COMIC Alphabeta Monthly Vol. 18', titleJpn: 'コミック甲 Vol.18' }
    const chapters = matchExtractedChapters(magazine, [
      hit(11, '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18) [English]'),
      hit(12, '[Artist Beta] Work Gamma [English]', '[作者乙] 作品丙 (コミック甲 Vol.18) [英訳]'),
      hit(13, '[Artist Gamma] Work Delta (COMIC Alphabeta Monthly Vol. 17) [English]'),
      hit(14, 'COMIC Alphabeta Monthly Vol. 19'),
    ])
    expect(chapters.map((chapter) => chapter.gid)).toEqual([11, 12])
  })

  it('reads the container out of its own block when the chapter also carries a part number', () => {
    const magazine: SourceGallery = { ...manga, title: 'COMIC Alphabeta Monthly Vol. 18', titleJpn: 'コミック甲 Vol.18' }
    // the part number sits in a block of its own, and the two joined name nothing
    const chapters = matchExtractedChapters(magazine, [
      hit(21, '[Artist Alpha] Work Beta -Subtitle Alpha (3)- (COMIC Alphabeta Monthly Vol. 18) [English]'),
      hit(22, '[Artist Beta] Work Gamma (2) (COMIC Alphabeta Monthly Vol. 17) [English]'),
    ])
    expect(chapters.map((chapter) => chapter.gid)).toEqual([21])
    // and the same chapter searches for that container, not for `3 COMIC …`
    const chapter = planSearch({ ...manga, title: '[Artist Alpha] Work Beta -Subtitle Alpha (3)- (COMIC Alphabeta Monthly Vol. 18) [English]' })
    expect(chapter.containerTerms).toEqual(['COMIC Alphabeta Monthly Vol. 18'])
  })
})
