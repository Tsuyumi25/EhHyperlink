import { search } from './plan'

// 單一作者：原文取左片段，羅馬字取右片段。
search({
  title: '[Circle Alpha] Work Beta Kouhen 2',
  titleJpn: '[圓環甲] 作品乙丙 後編 2',
  tags: ['artist:artistalpha'],
}).expect({ editionTerms: ['作品', 'Beta'], fixedRange: true })

// 缺少另一欄時由同一欄提供兩端；短標題保留整段。
search({
  title: '[Circle Alpha] Work Beta Gamma',
  tags: ['artist:artistalpha'],
}).expect({ editionTerms: ['Work', 'Gamma'], fixedRange: true })
search({
  titleJpn: '[圓環甲] 甲乙丙丁戊己庚辛壬癸',
  tags: ['artist:artistalpha'],
}).expect({ editionTerms: ['甲乙', '壬癸'], fixedRange: true })
search({ titleJpn: '[作者甲] 作品乙', tags: ['artist:artistalpha'] }).expect({
  editionTerms: ['作品乙'],
  fixedRange: true,
})

// 全角羅馬數字經標題正規化後再移除卷號。
search({ title: '[作者甲] 作品丙 Ⅲ', tags: ['artist:artistalpha'] }).expect({
  editionTerms: ['作品丙'],
  fixedRange: true,
})

// 作者範圍附加於片段搜尋。
search({
  title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
  tags: ['artist:artist_alpha'],
}).expect({ scope: 'a:"artist alpha$"', fixedRange: true })
search({
  title: 'Work Beta',
  tags: ['artist:artist_alpha', 'female:x'],
}).expect({ scope: 'a:"artist alpha$"', fixedRange: true })

search({
  title: '[Circle Alpha] 2025甲乙',
  tags: ['artist:artistalpha'],
}).expect({ editionTerms: ['202', '甲乙'] })

search({
  title: '[Circle Alpha] 20甲乙',
  tags: ['artist:artistalpha'],
}).expect({ editionTerms: ['20甲', '甲乙'] })

search({
  title: '[Circle Alpha] 20 Alpha',
  tags: ['artist:artistalpha'],
}).expect({ editionTerms: ['Alpha'] })

search({
  title: '[Circle Alpha] 2025 Alpha',
  tags: ['artist:artistalpha'],
}).expect({ editionTerms: ['2025', 'Alpha'] })

search({
  title: '[Circle Alpha] Work Beta #6',
  titleJpn: '[圓環甲] 作品甲乙＃６',
  tags: ['artist:artist_alpha'],
}).expect({ editionTerms: ['作品', 'Beta'] })
