import { describe, expect, it } from 'vitest'
import { detectLanguage } from './detectLanguage'
import type { SearchHit } from '../eh/ehSearch'
import type { SourceGallery } from '../eh/galleryPage'
import { dedupe, editionFlags, enrichHits, groupByLanguage, groupReleases, scoreEditions, toEdition } from './edition'
import { creatorVerdict, galleryTitleSimilarity } from './titleSimilarity'

// Every title below is invented.

function hit(gid: number, title: string, tags: string[] = [], posted: number | null = null): SearchHit {
  return { gid, token: '0000000000', href: `https://e-hentai.org/g/${gid}/0000000000/`, title, titleJpn: '', category: 'Doujinshi', tags, pages: null, posted, torrentHref: null }
}

const source: SourceGallery = {
  gid: 1000,
  title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
  titleJpn: '',
  category: 'Doujinshi',
  tags: ['artist:artistalpha'],
}

describe('edition scoring and grouping', () => {
  it('drops the source itself (via dedupe) and low-similarity hits, then groups by language in priority order', () => {
    const { editions, series } = scoreEditions(source, dedupe([
      hit(1000, source.title),
      hit(1001, '[Artistalpha.] Work Beta [Spanish] [Some Scans]', ['language:spanish', 'language:translated']),
      hit(1002, '[Pixiv] [Artistalpha] Work Beta (Series Gamma) [English]', ['language:english', 'language:translated']),
      hit(1003, '[Artistalpha.] Work Beta [中国翻訳]'),
      hit(1004, '[Someone Else] Work Beta [English]', ['language:english']),
    ], source.gid))
    expect(series).toEqual([])
    const groups = groupByLanguage(editions, ['chinese', 'japanese', 'english'])
    expect(groups.map((group) => group.language.value)).toEqual(['chinese', 'english', 'spanish'])
    expect(groups[1].books.flatMap((book) => book.releases.map((release) => release.hit.gid))).toEqual([1002])
  })

  it('separates the same book from other books of the series', () => {
    const chapter: SourceGallery = { ...source, title: '[Artistalpha] Work Beta Ch. 10 (COMIC Alphabeta Monthly Vol. 40) [English]' }
    const { editions, series } = scoreEditions(chapter, [
      hit(1, '[Artistalpha] Work Beta Ch.10 (COMIC Alphabeta Monthly Vol. 40) [Chinese]'),
      hit(2, '[Artistalpha] Work Beta Ch. 9 (COMIC Alphabeta Monthly Vol. 39) [English]'),
      hit(3, '[Artistalpha] Work Beta Ch. 1-9 [Korean]'),
      hit(4, '[Artistalpha] Work Beta 10 | Translated Work Beta Ch. 10 [French]'),
      hit(5, '[Artistalpha] Work Beta Ch. 10 | 作品乙10 [Chinese]'),
    ])
    expect(editions.map((edition) => edition.hit.gid)).toEqual([1, 4, 5])
    expect(series.map((edition) => edition.hit.gid)).toEqual([2, 3])
  })

  it('lists a same-creator book whose title names this work in a bracket, by tags or by creator block', () => {
    const work: SourceGallery = { ...source, title: '(C61) [Circle Alpha (Artist Alpha)] Work Beta 3 (Series Gamma) [Chinese]', tags: ['artist:artist_alpha', 'group:circle_alpha'] }
    const { series } = scoreEditions(work, [
      hit(1, '[Circle Alpha (Artist Alpha)] Work Delta (Work Beta 3 Collection) (Series Gamma) [Chinese]', ['artist:artist_alpha']),
      hit(2, '[Circle Alpha (Artist Alpha)] Work Delta (Work Beta 3 Collection) (Series Gamma) [Chinese]'),
      hit(3, '[Someone Else] Work Delta (Work Beta 3 Collection) (Series Gamma) [Chinese]'),
      hit(4, '[Circle Alpha (Artist Alpha)] Work Epsilon (Series Gamma) [Chinese]', ['artist:artist_alpha']),
    ])
    expect(series.map((edition) => edition.hit.gid)).toEqual([1, 2])
  })

  it('keeps releases of one book together and separate books apart', () => {
    const releases = [
      hit(1, '[Circle Alpha] Work Beta 1 [Chinese] [Alpha Scans]', ['language:chinese']),
      hit(2, '[Circle Alpha] Work Beta 1 [Chinese] [Beta Scans] [Decensored] [38P]', ['language:chinese']),
      hit(3, '[Circle Alpha] Work Beta 2 [Chinese] [Alpha Scans]', ['language:chinese']),
      // a different creator writing the same work text is a different book
      hit(4, '[Circle Omega] Work Beta 1 [Chinese] [Alpha Scans]', ['language:chinese']),
    ].map((galleryHit) => toEdition(galleryHit, 0.9))
    const books = groupReleases(releases)
    // grouping only, not order: the rows carry no date, so their part numbers decide
    const grouped = books.map((book) => book.releases.map((release) => release.hit.gid)).sort((a, b) => a[0] - b[0])
    expect(grouped).toEqual([[1, 2], [3], [4]])
  })

  it('groups releases inside each language bucket', () => {
    const groups = groupByLanguage(
      [
        hit(1, '[Circle Alpha] Work Beta [Chinese] [Alpha Scans]', ['language:chinese']),
        hit(2, '[Circle Alpha] Work Beta [Chinese] [Beta Scans]', ['language:chinese']),
        hit(3, '[Circle Alpha] Work Beta [English]', ['language:english']),
      ].map((galleryHit) => toEdition(galleryHit, 0.9)),
      ['chinese', 'english'],
    )
    expect(groups.map((group) => group.books.map((book) => book.releases.length))).toEqual([[2], [1]])
  })

  it('ignores the translated half of a title, but finds the counter on either side', () => {
    const books = groupReleases(
      [
        hit(1, '[Circle Alpha] Work Beta [Chinese] [Alpha Scans]', ['language:chinese']),
        // a translation that differs between releases, and one with none at all
        hit(2, '[Circle Alpha] Work Beta | 作品乙 [Chinese] [Beta Scans]', ['language:chinese']),
        hit(3, '[Circle Alpha] Work Beta | 譯名甲 [Chinese] [Gamma Scans]', ['language:chinese']),
        // the counter written only after the bar still separates two chapters
        hit(4, '[Circle Alpha] Work Beta | 作品乙 1 [Chinese]', ['language:chinese']),
        hit(5, '[Circle Alpha] Work Beta | 作品乙 2 [Chinese]', ['language:chinese']),
      ].map((galleryHit) => toEdition(galleryHit, 0.9)),
    )
    const grouped = books.map((book) => book.releases.map((release) => release.hit.gid)).sort((a, b) => a[0] - b[0])
    expect(grouped).toEqual([[1, 2, 3], [4], [5]])
  })

  it('separates books the search phrase writes alike: wrapped subtitle, and a number the counter misses', () => {
    const books = groupReleases(
      [
        // the phrase drops what the marks wrapped, so only the wrapper separates these two
        hit(1, '[Circle Alpha] Work Beta ~副題甲~ [Chinese]', ['language:chinese']),
        hit(2, '[Circle Alpha] Work Beta ~副題甲~ [Chinese] [Beta Scans]', ['language:chinese']),
        hit(3, '[Circle Alpha] Work Beta ~副題乙~ [Chinese]', ['language:chinese']),
        // the chapter marker reads the first number only; the second still tells them apart
        hit(4, '[Circle Alpha] Work Gamma Ch. 1 & 4 [Chinese]', ['language:chinese']),
        hit(5, '[Circle Alpha] Work Gamma Ch. 1 [Chinese]', ['language:chinese']),
      ].map((galleryHit) => toEdition(galleryHit, 0.9)),
    )
    const grouped = books.map((book) => book.releases.map((release) => release.hit.gid)).sort((a, b) => a[0] - b[0])
    expect(grouped).toEqual([[1, 2], [3], [4], [5]])
  })

  it('orders by part number when both rows have one, by upload date otherwise', () => {
    const day = 86400
    const books = groupReleases(
      [
        // out of order on purpose: 10 must not sort between 1 and 2
        hit(1, '[Circle Alpha] Work Beta 10 [Chinese]', ['language:chinese'], 5 * day),
        hit(2, '[Circle Alpha] Work Beta 2 [Chinese]', ['language:chinese'], 9 * day),
        hit(3, '[Circle Alpha] Work Beta 1 [Chinese]', ['language:chinese'], 7 * day),
      ].map((galleryHit) => toEdition(galleryHit, 0.9)),
    )
    expect(books.map((book) => book.releases[0].hit.gid)).toEqual([3, 2, 1])
  })

  it('orders word markers and releases of one book by upload date', () => {
    const day = 86400
    const books = groupReleases(
      [
        // 前編 / 後編 carry no number, so the dates decide
        hit(1, '[Circle Alpha] Work Beta 後編 [Chinese]', ['language:chinese'], 4 * day),
        hit(2, '[Circle Alpha] Work Beta 前編 [Chinese]', ['language:chinese'], 2 * day),
        // two releases of the same book: the earlier upload leads, and the book
        // travels on it
        hit(3, '[Circle Alpha] Work Beta 前編 [Chinese] [Beta Scans]', ['language:chinese'], 1 * day),
      ].map((galleryHit) => toEdition(galleryHit, 0.9)),
    )
    expect(books.map((book) => book.releases.map((release) => release.hit.gid))).toEqual([[3, 2], [1]])
  })

  it('sorts a row with no date last rather than first', () => {
    const books = groupReleases(
      [
        hit(1, '[Circle Alpha] Work Beta 前編 [Chinese]', ['language:chinese'], null),
        hit(2, '[Circle Alpha] Work Beta 後編 [Chinese]', ['language:chinese'], 86400),
      ].map((galleryHit) => toEdition(galleryHit, 0.9)),
    )
    expect(books.map((book) => book.releases[0].hit.gid)).toEqual([2, 1])
  })
})

describe('language detection', () => {
  it('prefers tags, then title markers, then the Japanese default for tagged rows', () => {
    expect(detectLanguage('[A] T [English]', ['language:chinese', 'language:translated'])).toBe('chinese')
    expect(detectLanguage('[A] T [中国翻訳]', [])).toBe('chinese')
    expect(detectLanguage('[A] T', ['artist:a'])).toBe('japanese')
    expect(detectLanguage('[A] T', ['artist:a', 'language:translated'])).toBe('unknown')
    expect(detectLanguage('[A] T', [])).toBe('unknown')
  })
})


describe('creator tags as a second identity source', () => {
  it('lets a pen-name change through when artist tags agree, and blocks tagged strangers', () => {
    expect(creatorVerdict(['artist:artist_alpha', 'female:x'], ['artist:artist alpha'])).toBe('same')
    expect(creatorVerdict(['artist:artist alpha'], ['artist:someone else'])).toBe('different')
    expect(creatorVerdict(['artist:artist alpha'], ['female:x'])).toBe('unknown')
    expect(creatorVerdict([], ['artist:artist alpha'])).toBe('unknown')
  })

  it('overrides the title identity in both directions', () => {
    const oldName = '[Circle Beta] Work Beta'
    const newName = '[Artist Alpha] Work Beta [Chinese]'
    expect(galleryTitleSimilarity(oldName, '', newName, '')).toBe(0)
    expect(galleryTitleSimilarity(oldName, '', newName, '', 'same')).toBe(1)
    const sameName = '[Circle Beta] Work Beta [Chinese]'
    expect(galleryTitleSimilarity(oldName, '', sameName, '', 'different')).toBe(0)
  })

  it('groups a renamed creator edition once tags say it is the same person', () => {
    const renamed = hit(2001, '[Artist Alpha] Work Beta [Chinese]', ['language:chinese', 'language:translated', 'artist:artistalpha'])
    expect(scoreEditions(source, [renamed]).editions).toHaveLength(1)
    const stranger = hit(2002, '[Artistalpha] Work Beta [Chinese]', ['language:chinese', 'artist:someone else'])
    expect(scoreEditions(source, [stranger]).editions).toHaveLength(0)
    const aiTagged = hit(2003, '[Artistalpha] Work Beta [Chinese]', ['language:chinese', 'artist:artistalpha', 'other:ai_generated'])
    expect(scoreEditions(source, [aiTagged]).editions).toHaveLength(0)
  })

  it('fills the Japanese title and tags from metadata and reads quality flags', () => {
    const bare = hit(3001, '[Artistalpha] Work Beta [English]')
    const [enriched] = enrichHits([bare], new Map([[3001, { gid: 3001, title: bare.title, titleJpn: '[作者甲] 作品乙 [英訳]', category: 'Doujinshi', posted: 1700000000, tags: ['language:english', 'language:rewrite', 'other:rough translation', 'artist:artistalpha'] }]]))
    expect(enriched.titleJpn).toBe('[作者甲] 作品乙 [英訳]')
    expect(enriched.posted).toBe(1700000000)
    expect(editionFlags(enriched.tags)).toEqual(['rewrite', 'rough translation'])
    expect(editionFlags(['language:english'])).toEqual([])
  })
})