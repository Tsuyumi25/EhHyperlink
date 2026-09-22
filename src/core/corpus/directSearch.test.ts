import { planSearch, queryOf } from '../search/searchPlan'
import { defineCase } from './check'
import { gallery, type GalleryInput } from './gallery'
import { search } from './plan'

const queries = defineCase<GalleryInput, string[]>('搜尋語法', (input) => {
  const plan = planSearch(gallery(input))
  return plan.editionTerms.map((term) => queryOf(plan, term))
})

// 以下標題、標籤與 gid 皆為虛構。

// cosplayer 標籤就是答案：標題不讀，作者範圍與刊物計畫都不進來
search({
  title: '[Studio Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18)',
  category: 'Manga',
  tags: ['cosplayer:name_alpha', 'artist:artist_alpha'],
}).expect({
  mode: 'cosplayer',
  visibility: 'published',
  editionTerms: ['cosplayer:"name alpha$"'],
  scope: '',
  fixedRange: false,
  containerTerms: [],
  containerNames: [],
  chapterTerms: [],
  isContainerCandidate: false,
})

// 兩個標籤都在時仍由 cosplayer 決定模式，搜尋領域限於 expunged
search({
  title: '[Studio Alpha] Photo Set Beta',
  tags: ['other:realporn', 'cosplayer:name_alpha'],
}).expect({
  mode: 'cosplayer',
  visibility: 'expunged',
  editionTerms: ['cosplayer:"name alpha$"'],
})

// 每位 cosplayer 各一次搜尋；底線換成空白之後同名的只送一次
search({ tags: ['cosplayer:name_alpha', 'cosplayer:name_beta', 'cosplayer:name alpha'] }).expect({
  mode: 'cosplayer',
  editionTerms: ['cosplayer:"name alpha$"', 'cosplayer:"name beta$"'],
})

// 沒有 cosplayer 標籤時讀開頭的身分區塊，標點與巢狀區塊照標題寫的送出
search({ title: '[Model Alpha! (Studio Beta)] Photo Set Gamma', tags: ['other:realporn'] }).expect({
  mode: 'realporn',
  visibility: 'expunged',
  editionTerms: ['Model Alpha! (Studio Beta)'],
  scope: '',
  fixedRange: false,
  isContainerCandidate: false,
})

// 分開的兩個區塊是兩次搜尋：沒有標題把它們並排寫過
search({ title: '[Studio Alpha] [Model Beta.] Photo Set Gamma', tags: ['other:realporn'] }).expect({
  editionTerms: ['Studio Alpha', 'Model Beta.'],
})

// 兩個標題欄位的身分區塊都參與，重複的不送第二次
search({
  title: '[Model Alpha] Photo Set Beta',
  titleJpn: '[模特甲] 寫真乙',
  tags: ['other:realporn'],
}).expect({ editionTerms: ['Model Alpha', '模特甲'] })
search({
  title: '[Model Alpha] Photo Set Beta',
  titleJpn: '[Model Alpha] 寫真乙',
  tags: ['other:realporn'],
}).expect({ editionTerms: ['Model Alpha'] })

// 標題沒寫出任何人時回到作品路徑的短片段：原文取左、轉寫取右
search({
  title: 'Photo Set Beta Gamma',
  titleJpn: '甲乙丙丁戊己庚辛壬癸',
  tags: ['other:realporn'],
}).expect({ mode: 'realporn', visibility: 'expunged', editionTerms: ['甲乙', 'Gamma'] })

// 括號不成對的標題沒有身分區塊，片段也不從整串原文裡切
search({ title: '[Model Alpha Photo Set Beta', tags: ['other:realporn'] }).expect({
  mode: 'realporn',
  editionTerms: [],
})

// 一般書本不受影響：other: 命名空間底下的其他標籤不是 realporn
search({
  title: '[Circle Alpha] Work Beta Kouhen 2',
  titleJpn: '[圓環甲] 作品乙丙 後編 2',
  tags: ['artist:artist_alpha', 'other:tag_alpha'],
}).expect({
  mode: 'work',
  visibility: 'published',
  editionTerms: ['作品', 'Beta'],
  scope: 'a:"artist alpha$"',
  fixedRange: true,
})

// cosplayer 詞句本身就是完整的精確標籤子句，不再加 title:
queries({ tags: ['cosplayer:name_alpha'] }).expect(['cosplayer:"name alpha$"'])

// realporn 來源的每一次搜尋都帶精確標籤，避免納入該領域裡的其他內容
queries({ tags: ['cosplayer:name_alpha', 'other:realporn'] }).expect([
  'cosplayer:"name alpha$" other:"realporn$"',
])
queries({ title: '[Model Alpha] Photo Set Beta', tags: ['other:realporn'] }).expect([
  'title:"Model Alpha" other:"realporn$"',
])

// 一般書本的搜尋帶作者範圍，不帶 realporn 子句
queries({ title: '[Circle Alpha] Work Beta Gamma', tags: ['artist:artist_alpha'] }).expect([
  'title:"Work" a:"artist alpha$"',
  'title:"Gamma" a:"artist alpha$"',
])
