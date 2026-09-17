import { describe, expect, it } from 'vitest'
import { detectLanguage } from './detectLanguage'
import type { SearchHit } from '../eh/ehSearch'
import type { SourceGallery } from '../eh/galleryPage'
import { dedupe, editionFlags, enrichHits, groupByLanguage, scoreEditions } from './edition'
import { creatorVerdict, galleryTitleSimilarity } from './titleSimilarity'

// Every title below is invented.

function hit(gid: number, title: string, tags: string[] = []): SearchHit {
  return { gid, token: '0000000000', href: `https://e-hentai.org/g/${gid}/0000000000/`, title, titleJpn: '', category: 'Doujinshi', tags, pages: null, torrentHref: null }
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
    expect(groups[1].items.map((edition) => edition.hit.gid)).toEqual([1002])
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
    const [enriched] = enrichHits([bare], new Map([[3001, { gid: 3001, title: bare.title, titleJpn: '[作者甲] 作品乙 [英訳]', category: 'Doujinshi', tags: ['language:english', 'language:rewrite', 'other:rough translation', 'artist:artistalpha'] }]]))
    expect(enriched.titleJpn).toBe('[作者甲] 作品乙 [英訳]')
    expect(editionFlags(enriched.tags)).toEqual(['rewrite', 'rough translation'])
    expect(editionFlags(['language:english'])).toEqual([])
  })
})