import { describe, expect, it } from 'vitest'
import { readWorkText } from '../title/chapter'
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
    expect(readWorkText('Work Gamma Ch. 1-7').phrase).toBe('Work Gamma')
    expect(readWorkText('作品丙 第1-7話').phrase).toBe('作品丙')
    expect(readWorkText('Work Gamma Vol. 8').phrase).toBe('Work Gamma')
    expect(readWorkText('作品丙 第8巻').phrase).toBe('作品丙')
    expect(readWorkText('Work Gamma Ch.3').phrase).toBe('Work Gamma')
    expect(readWorkText('Chapter 3 Alpha Beta').phrase).toBe('Alpha Beta')
  })

  it('drops the other labels the corpus counts with', () => {
    expect(readWorkText('Work Beta part2')).toEqual({ phrase: 'Work Beta', counter: '2' })
    expect(readWorkText('Work Beta - part 1').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta PART2').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta pt1').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta ep.3').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta Episode 20')).toEqual({ phrase: 'Work Beta', counter: '20' })
    expect(readWorkText('Work Beta Image Set 2').phrase).toBe('Work Beta Image')
    // sono is the romanization of 其の, which only the romanized field writes
    expect(readWorkText('Work Beta sono 3').phrase).toBe('Work Beta')
    // a letter before the label puts it inside a word
    expect(readWorkText('Work Sunset 3').phrase).toBe('Work Sunset')
    expect(readWorkText('Work Partner 2').phrase).toBe('Work Partner')
    // and the label needs a number after it
    expect(readWorkText('Work Beta Part Two').phrase).toBe('Work Beta Part Two')
  })

  it('drops a bare trailing series number only, decimals included', () => {
    expect(readWorkText('作品丁を教えて! 5').phrase).toBe('作品丁を教えて')
    expect(readWorkText('Alpha x Beta x Gamma 3').phrase).toBe('Alpha x Beta x Gamma')
    expect(readWorkText('Alpha x Beta x Gamma 4.5').phrase).toBe('Alpha x Beta x Gamma')
    expect(readWorkText('作品丁のほん5').phrase).toBe('作品丁のほん')
    expect(readWorkText('作品丁本子5').phrase).toBe('作品丁本子')
    expect(readWorkText('Alpha5').phrase).toBe('Alpha5')
    expect(readWorkText('唯一').phrase).toBe('唯一')
    expect(readWorkText('Work Delta 2.0').phrase).toBe('Work Delta')
    expect(readWorkText('Work Gamma Ch. 4.5').phrase).toBe('Work Gamma')
    expect(readWorkText('作品丙 第4.5話').phrase).toBe('作品丙')
    expect(readWorkText('Volume Trader').phrase).toBe('Volume Trader')
    expect(readWorkText('Route 2024').phrase).toBe('Route 2024')
    expect(readWorkText('Version 1.2.3').phrase).toBe('Version 1.2.3')
    expect(readWorkText('7').phrase).toBe('7')
  })

  it('drops a span of counters, whichever dash the title writes it with', () => {
    expect(readWorkText('Work Beta 1~36')).toEqual({ phrase: 'Work Beta', counter: '1~36' })
    expect(readWorkText('Work Beta 1-36').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta 1–36').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta 1—36').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta 1－36').phrase).toBe('Work Beta')
    expect(readWorkText('作品乙 1~36').phrase).toBe('作品乙')
    expect(readWorkText('作品丙 第72~74話').phrase).toBe('作品丙')
    // the fullwidth wave dashes reach the same titles as group separators
    expect(readWorkText('作品乙 1〜36').phrase).toBe('作品乙')
    // a comma enumerates rather than spans, and four digits are not a counter
    expect(readWorkText('Work Beta 1,2,3').phrase).toBe('Work Beta 1,2,3')
    expect(readWorkText('Work Beta 2007.1~12').phrase).toBe('Work Beta 2007.1~12')
  })
  it('reads CJK numeral counters and leaves non-numeral kanji runs alone', () => {
    expect(readWorkText('作品丙 第三話').phrase).toBe('作品丙')
    expect(readWorkText('作品丙 第十二巻').phrase).toBe('作品丙')
    expect(readWorkText('作品丙 第一百零二话').phrase).toBe('作品丙')
    expect(readWorkText('作品丙 弐').phrase).toBe('作品丙')
    expect(readWorkText('作品丙 十十').phrase).toBe('作品丙 十十')
    expect(readWorkText('第三話').phrase).toBe('')
  })

  it('drops a trailing roman counter but keeps X forms', () => {
    expect(readWorkText('Work Gamma II').phrase).toBe('Work Gamma')
    expect(readWorkText('Work Gamma iv').phrase).toBe('Work Gamma')
    expect(planSearch({ ...source, title: '[作者甲] 作品丙 Ⅲ' }).editionTerms).toEqual(['作品丙'])
    expect(readWorkText('Work Gamma X').phrase).toBe('Work Gamma X')
    expect(readWorkText('Work Gamma XXX').phrase).toBe('Work Gamma XXX')
    expect(readWorkText('Work Gammavii').phrase).toBe('Work Gammavii')
  })

  it('drops a series word as a group tail, but not a subtitle', () => {
    expect(readWorkText('作品丙 後編').phrase).toBe('作品丙')
    expect(readWorkText('作品丙 上巻').phrase).toBe('作品丙')
    expect(readWorkText('作品丙 総集編').phrase).toBe('作品丙')
    expect(readWorkText('作品丙 花').phrase).toBe('作品丙 花')
    expect(readWorkText('作品丙・番外篇').phrase).toBe('作品丙')
    // the text of a multi-character series word settles its own meaning, so no space is needed
    expect(readWorkText('作品丙後編').phrase).toBe('作品丙')
    // Chinese and variant forms read the same as the kanji ones
    expect(readWorkText('作品丙 后篇').phrase).toBe('作品丙')
    expect(readWorkText('作品丙 总集篇').phrase).toBe('作品丙')
    // a short word still needs the position: 天下 keeps its 下
    expect(readWorkText('作品丙 天下').phrase).toBe('作品丙 天下')
  })

  it('reads a space-isolated part name ending in 編 / 篇 as the counter', () => {
    expect(readWorkText('作品乙の冒険 アイウエ編')).toEqual({ phrase: '作品乙の冒険', counter: 'アイウエ編' })
    expect(readWorkText('作品乙 甲編')).toEqual({ phrase: '作品乙', counter: '甲編' })
    // two markers stacked: the part name comes off, and the number glued to 乙 behind it
    expect(readWorkText('作品乙2 保健甲編').phrase).toBe('作品乙')
    // the rightmost group decides, and the counter is what came off it
    expect(readWorkText('作品乙 ～副題甲～ 丙編')).toEqual({ phrase: '作品乙～副題甲', counter: '丙編' })
    // the shape is what identifies it, so it needs the space and a token that ends
    expect(readWorkText('作品乙アイウエ編').phrase).toBe('作品乙アイウエ編')
    expect(readWorkText('作品乙 とてもとてもとても長い題名の編').phrase).toBe('作品乙 とてもとてもとても長い題名の編')
  })

  it('reads a bare counter hiding behind an ellipsis, and strips until the group settles', () => {
    expect(readWorkText('作品乙に協力したら...2')).toEqual({ phrase: '作品乙に協力したら', counter: '2' })
    expect(readWorkText('作品乙…2').phrase).toBe('作品乙')
    expect(readWorkText('作品乙..2').phrase).toBe('作品乙')
    // the separators that write numbers of their own keep them
    expect(readWorkText('COMIC Alphabeta Monthly 2002-11').phrase).toBe('COMIC Alphabeta Monthly 2002-11')
    expect(readWorkText('Version 1.2.3').phrase).toBe('Version 1.2.3')
    expect(readWorkText('作品乙 3／4').phrase).toBe('作品乙 3／4')
  })

  it('reads the romanized series words the other title field writes in kanji', () => {
    expect(readWorkText('Work Beta Zenpen')).toEqual({ phrase: 'Work Beta', counter: 'Zenpen' })
    expect(readWorkText('Work Beta Kouhen')).toEqual({ phrase: 'Work Beta', counter: 'Kouhen' })
    expect(readWorkText('Work Beta Gekan').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta Saishuuwa').phrase).toBe('Work Beta')
    // a digit after it is still the same marker
    expect(readWorkText('Work Beta Soushuuhen2').phrase).toBe('Work Beta')
    expect(readWorkText('Work Beta-Soushuuhen-').phrase).toBe('Work Beta')
    // a letter on either side means it is part of a word
    expect(readWorkText('Work Beta Kouhentai').phrase).toBe('Work Beta Kouhentai')
    expect(readWorkText('Work Kouhenbeta').phrase).toBe('Work Kouhenbeta')
    // under the corpus bar, so deliberately absent
    expect(readWorkText('Work Beta Kanketsuhen').phrase).toBe('Work Beta Kanketsuhen')
    expect(readWorkText('Work Beta Honpen').phrase).toBe('Work Beta Honpen')
    expect(readWorkText('Work Beta Chuukan').phrase).toBe('Work Beta Chuukan')
  })

  it('reads a marker at the end of any group, not only of the whole text', () => {
    // punctuation after the marker no longer hides it, and the emptied group takes its separator
    expect(readWorkText('作品乙 後編。').phrase).toBe('作品乙')
    expect(readWorkText('作品甲、作品乙。2').phrase).toBe('作品甲、作品乙')
    // punctuation before the marker no longer hides it either
    expect(readWorkText('作品甲・作品乙・後編').phrase).toBe('作品甲・作品乙')
    expect(readWorkText('作品甲〜作品乙〜後編').phrase).toBe('作品甲〜作品乙')
    expect(readWorkText('作品乙・上').phrase).toBe('作品乙')
    // a compound still has neither space nor punctuation before its last character
    expect(readWorkText('作品乙、天下').phrase).toBe('作品乙、天下')
    expect(readWorkText('作品乙。改造').phrase).toBe('作品乙。改造')
    // the separators that carry counters of their own stay out of the split
    expect(readWorkText('COMIC Alphabeta Monthly 2002-11').phrase).toBe('COMIC Alphabeta Monthly 2002-11')
    expect(readWorkText('作品乙 3／4').phrase).toBe('作品乙 3／4')
    // `ー` is a letter by category, so a counter glued after it still reads as one,
    // but at an edge it carries no work text and is trimmed with the other marks
    expect(readWorkText('作品乙ー後編ー').phrase).toBe('作品乙')
    expect(readWorkText('作品乙カラー9').phrase).toBe('作品乙カラ')
    // punctuation at the edges goes with it: editions in other languages punctuate differently
    expect(readWorkText('作品乙。').phrase).toBe('作品乙')
  })
})

describe('work phrase', () => {
  it('cuts at the first marker and keeps the work side', () => {
    expect(readWorkText('Work Beta Vol. 02 Gamma').phrase).toBe('Work Beta')
    expect(readWorkText('作品乙 第3話 副題甲').phrase).toBe('作品乙')
    // several markers: the first one already ends the work title
    expect(readWorkText('Work Beta Vol. 2 - Ch. 1-6').phrase).toBe('Work Beta')
    // a marker that opens the segment leaves only the right side
    expect(readWorkText('Chapter 3 Work Beta').phrase).toBe('Work Beta')
    // a series word cuts wherever it sits, glued or wrapped in punctuation
    expect(readWorkText('作品丙後編').phrase).toBe('作品丙')
    expect(readWorkText('作品乙ー後編ー').phrase).toBe('作品乙')
    expect(readWorkText('作品乙 后篇').phrase).toBe('作品乙')
  })

  it('cuts at a counter standing alone between two tokens', () => {
    expect(readWorkText('作品乙 四 副題甲の話').phrase).toBe('作品乙')
    expect(readWorkText('Work Beta 4 Subtitle Gamma').phrase).toBe('Work Beta')
    expect(readWorkText('作品乙 弐 副題甲').counter).toBe('弐')
    // a counter at the tail is a group tail, not a cut point
    expect(readWorkText('作品乙 四').phrase).toBe('作品乙')
    // glued to a word it is neither: 14 stays inside the work text
    expect(readWorkText('Work Beta14 Gamma').phrase).toBe('Work Beta14 Gamma')
    // a cut that would leave one character is no cut
    expect(readWorkText('A 4 Work Beta').phrase).toBe('Work Beta')
  })

  it('stays a substring of its segment, so the source retrieves itself', () => {
    for (const segment of ['Work Beta Vol. 02 Gamma', '作品乙 第3話 副題甲', 'Work Beta Vol. 2 - Ch. 1-6', '作品乙。2', 'Work Beta 5']) {
      expect(segment).toContain(readWorkText(segment).phrase)
    }
  })

  it('falls back to group tails when no label is present', () => {
    expect(readWorkText('Work Beta 5').phrase).toBe('Work Beta')
    expect(readWorkText('作品乙。2').phrase).toBe('作品乙')
    expect(readWorkText('作品乙・上').phrase).toBe('作品乙')
    expect(readWorkText('Work Beta').phrase).toBe('Work Beta')
    expect(readWorkText('作品乙、天下').phrase).toBe('作品乙、天下')
  })

  it('reads the counter with the label dropped and the subtitle left out', () => {
    // the same part in two languages: the subtitle differs, the counter does not
    expect(readWorkText('Work Beta Vol. 02 Gamma')).toEqual({ phrase: 'Work Beta', counter: '02' })
    expect(readWorkText('Work Beta Vol. 02 副題甲')).toEqual({ phrase: 'Work Beta', counter: '02' })
    // the label drops out, so `Ch. 10` and a bare `10` agree
    expect(readWorkText('Work Beta Ch. 10').counter).toBe('10')
    expect(readWorkText('Work Beta 10').counter).toBe('10')
    expect(readWorkText('作品乙 第3話').counter).toBe('3')
    expect(readWorkText('作品乙 第十二巻').counter).toBe('十二')
    // a series word is its own counter, so 前編 and 後編 read as different parts
    expect(readWorkText('作品乙 前編').counter).toBe('前編')
    expect(readWorkText('作品乙 後編').counter).toBe('後編')
    expect(readWorkText('Work Beta').counter).toBe('')
  })
})

describe('search planning', () => {
  // Two creators keep the whole-phrase path: an anthology sits on nobody's shelf.
  const shared: SourceGallery = { ...source, tags: ['artist:artistalpha', 'artist:artistbeta'] }

  it('searches each title field by its written work text', () => {
    const plan = planSearch({ ...shared, titleJpn: '[作者甲] 作品乙' })
    expect(plan.editionTerms).toEqual(['Work Beta', '作品乙'])
    expect(plan.containerTerms).toEqual([])
  })

  it('reduces a romanized field and a kanji field to the same work', () => {
    // ehwiki romanizes the Japanese title, so one gallery writes the part two ways
    const plan = planSearch({ ...shared, title: '[Circle Alpha] Work Beta Kouhen', titleJpn: '[圓環甲] 作品乙 後編' })
    expect(plan.editionTerms).toEqual(['Work Beta', '作品乙'])
  })

  it('cuts one slice from each field when a single creator fixes the range', () => {
    // the scope already holds one person's shelf, so the query only has to
    // outlive whatever the title does around it
    const plan = planSearch({ ...source, title: '[Circle Alpha] Work Beta Kouhen 2', titleJpn: '[圓環甲] 作品乙丙 後編 2' })
    expect(plan.editionTerms).toEqual(['作品', 'Beta'])
  })

  it('takes both slices from one field when the other is missing', () => {
    expect(planSearch({ ...source, title: '[Circle Alpha] Work Beta Gamma' }).editionTerms).toEqual(['Work', 'Gamma'])
    expect(planSearch({ ...source, title: '', titleJpn: '[圓環甲] 作品乙丙丁' }).editionTerms).toEqual(['作品', '丙丁'])
  })

  it('sends one term when the phrase is too short to cut in two', () => {
    expect(planSearch({ ...source, title: '', titleJpn: '[作者甲] 作品乙' }).editionTerms).toEqual(['作品乙'])
  })

  it('skips digit-only and duplicate work text', () => {
    const plan = planSearch({ ...source, title: '[Artist] 2 (Parody)', titleJpn: '[作者] 2' })
    expect(plan.editionTerms).toEqual([])
  })

  it('searches each side of a translated-title bar minus its chapter marker', () => {
    expect(editionTermsOf('Work Beta 2 | Work Beta Translated Ch. 2')).toEqual(['Work Beta', 'Work Beta Translated'])
    const plan = planSearch({
      ...shared,
      category: 'Manga',
      title: '[Artist Alpha] Work Gamma Ch. 1-7 [Korean] [Some Team]',
      titleJpn: '[作者甲] 作品丙 第1-7話 [韓国翻訳]',
    })
    expect(plan.editionTerms).toEqual(['Work Gamma', '作品丙'])
  })

  it('searches the whole issue name when the gallery is tagged an anthology', () => {
    // A chapter names the issue verbatim, `(Work Beta -Gamma Delta- Vol. 24)`.
    // Cutting the counter would retrieve every issue of the magazine and push
    // this one's chapters off the first page; splicing the wrapper out used to
    // produce `Work Beta   Vol. 24`, which matches nothing at all.
    const anthology = {
      ...shared,
      category: 'Manga',
      title: '[Anthology] Work Beta -Gamma Delta- Vol. 24 [Digital]',
      titleJpn: '',
      tags: [...shared.tags, 'other:anthology'],
    }
    const plan = planSearch(anthology)
    expect(plan.editionTerms).toEqual(['Work Beta -Gamma Delta- Vol. 24'])
    // the container plan skips what the edition terms already send
    expect(plan.chapterTerms).toEqual([])
    expect(plan.fixedRange).toBe(false)

    // without the tag the counter goes, so the phrase reaches the other issues
    expect(planSearch({ ...anthology, tags: shared.tags }).editionTerms).toEqual(['Work Beta -Gamma Delta'])
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
