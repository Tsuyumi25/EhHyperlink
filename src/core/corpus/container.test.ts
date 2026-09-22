import { relations, sharedPhrase } from './matching'
import { chapters, containers } from './container'
import { search } from './plan'

// 選輯保留完整期名與副標；作者清單不限制搜尋範圍。
search({
  category: 'Manga',
  title: '[Anthology] Work Beta -Gamma Delta- Vol. 24 [Digital]',
  tags: ['artist:artistalpha', 'artist:artistbeta', 'other:anthology'],
}).expect({
  editionTerms: ['Work Beta -Gamma Delta- Vol. 24'],
  chapterTerms: [],
  scope: '',
  fixedRange: false,
})
search({
  category: 'Manga',
  title: '[Anthology] Work Beta -Gamma Delta- Vol. 24 [Digital]',
  tags: ['artist:artistalpha', 'artist:artistbeta'],
}).expect({
  editionTerms: ['Work Beta -Gamma Delta'],
  scope: '~a:"artistalpha$" ~a:"artistbeta$"',
  fixedRange: false,
})
search({
  title: 'Work Beta -Gamma Delta- Vol. 24',
  tags: ['other:anthology'],
}).expect({
  editionTerms: ['Work Beta -Gamma Delta- Vol. 24'],
  chapterTerms: [],
  isContainerCandidate: true,
  fixedRange: false,
})

// 章節的來源括號指向刊物；原作標籤與分類排除非刊物內容。
search({
  category: 'Manga',
  title:
    '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly 2010-02) [Thai ภาษาไทย] [Someone]',
  tags: ['artist:artist_alpha'],
}).expect({
  containerTerms: ['COMIC Alphabeta Monthly 2010-02'],
  containerNames: ['comic alphabeta monthly 2010 02'],
  isContainerCandidate: false,
})
search({
  category: 'Manga',
  title: '[Artist] Work Title (Series Beta) [English]',
  tags: ['parody:series_beta'],
}).expect({ containerTerms: [] })
search('[Artist] Work Title (Series Beta)').expect({
  isContainerCandidate: false,
})

// 兩個標題欄位的刊名都可用；刊物搜尋收錄章節時保留期號。
search({
  category: 'Manga',
  title: '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18) [English]',
  titleJpn: '[作者甲] 作品乙 (コミック甲 Vol.18) [英訳]',
}).expect({
  containerTerms: ['COMIC Alphabeta Monthly Vol. 18', 'コミック甲 Vol.18'],
})
search({
  category: 'Manga',
  title: 'COMIC Alphabeta Monthly Vol. 18',
  titleJpn: 'コミック甲 Vol.18',
}).expect({
  isContainerCandidate: true,
  editionTerms: ['COMIC Alphabeta Monthly', 'コミック甲'],
  chapterTerms: ['COMIC Alphabeta Monthly Vol. 18', 'コミック甲 Vol.18'],
})

// 來源刊物必須吻合該期；另一個標題欄位也能提供證據。
containers({
  source: {
    category: 'Manga',
    title: '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly 2010-02)',
    titleJpn: '[作者甲] 作品乙 (コミック甲 2010-02)',
  },
  hits: [
    { gid: 1, title: 'COMIC Alphabeta Monthly 2010-02' },
    { gid: 2, title: 'COMIC Alphabeta Monthly 2010-02 Vol. 38 [Digital]' },
    { gid: 3, title: 'COMIC Alpha 2011-10' },
    {
      gid: 4,
      title: 'Alphabeta Monthly Magazine 2010-02',
      titleJpn: 'コミック甲 2010-02',
    },
  ],
}).expect([1, 2, 4])
chapters({
  source: {
    category: 'Manga',
    title: 'COMIC Alphabeta Monthly Vol. 18',
    titleJpn: 'コミック甲 Vol.18',
  },
  hits: [
    {
      gid: 11,
      title:
        '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18) [English]',
    },
    {
      gid: 12,
      title: '[Artist Beta] Work Gamma [English]',
      titleJpn: '[作者乙] 作品丙 (コミック甲 Vol.18) [英訳]',
    },
    {
      gid: 13,
      title:
        '[Artist Gamma] Work Delta (COMIC Alphabeta Monthly Vol. 17) [English]',
    },
    { gid: 14, title: 'COMIC Alphabeta Monthly Vol. 19' },
  ],
}).expect([11, 12])

// 副標中的章號與刊物各自成段，避免拼出不存在的刊名。
chapters({
  source: {
    category: 'Manga',
    title: 'COMIC Alphabeta Monthly Vol. 18',
    titleJpn: 'コミック甲 Vol.18',
  },
  hits: [
    {
      gid: 21,
      title:
        '[Artist Alpha] Work Beta -Subtitle Alpha (3)- (COMIC Alphabeta Monthly Vol. 18) [English]',
    },
    {
      gid: 22,
      title:
        '[Artist Beta] Work Gamma (2) (COMIC Alphabeta Monthly Vol. 17) [English]',
    },
  ],
}).expect([21])
search({
  category: 'Manga',
  title:
    '[Artist Alpha] Work Beta -Subtitle Alpha (3)- (COMIC Alphabeta Monthly Vol. 18) [English]',
}).expect({ containerTerms: ['COMIC Alphabeta Monthly Vol. 18'] })

// context block 裡的雜誌名不能當成共用作品：別期的章節、這一期自己的章節都不算
sharedPhrase({
  source: 'COMIC Alphabeta Monthly Vol. 5',
  candidate: '[Circle Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 2)',
}).expect(false)
sharedPhrase({
  source: 'COMIC Alphabeta Monthly Vol. 5',
  candidate: '[Circle Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 5)',
}).expect(false)

// 雜誌的其他期就是它的系列
sharedPhrase({
  source: 'COMIC Alphabeta Monthly Vol. 5',
  candidate: 'COMIC Alphabeta Monthly Vol. 2',
}).expect(true)

// 來源是雜誌時每個作者的 tag 都在上面，創作者永遠一致，別期的章節仍然不進 series
relations({
  source: {
    title: 'COMIC Alphabeta Monthly Vol. 5',
    titleJpn: 'コミックアルファベータ Vol.5',
    category: 'Manga',
    tags: ['artist:artist alpha', 'artist:artist beta'],
  },
  hits: [
    {
      gid: 1,
      title: 'COMIC Alphabeta Monthly Vol. 2',
      tags: ['artist:artist alpha'],
    },
    {
      gid: 2,
      title:
        '[Circle Alpha] Work Gamma (COMIC Alphabeta Monthly Vol. 2) [Chinese]',
      tags: ['artist:artist alpha', 'language:chinese'],
    },
    {
      gid: 3,
      title:
        '[Circle Beta] Work Delta Ch. 3 (COMIC Alphabeta Monthly Vol. 11) [Chinese]',
      tags: ['artist:artist beta', 'language:chinese'],
    },
  ],
}).expect({ editions: [], series: [1], related: [] })
