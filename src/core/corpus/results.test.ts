import {
  coreSimilarity,
  creatorTags,
  enrichedEdition,
  flags,
  language,
  languageGroups,
  relations,
  releaseGroups,
  releaseOrder,
  similarity,
  similarityScore,
  sharedPhrase,
  relatedScores,
} from './matching'

// 整句比對：同一本書的不同寫法仍在門檻之上
similarity({
  source: {
    title: '[Circle Alpha] Work Beta - Sub Beta',
    titleJpn: '[サークル甲] 作品乙',
  },
  candidate: {
    title: '[Circle Alpha] Work Beta - Sub Beta -',
    titleJpn: '[サークル甲] 作品乙',
  },
}).expect('match')
similarity({
  source: {
    title: '(C61) [Circle Beta] Alpharakuyou (Series Beta)',
    titleJpn: '(C61) [サークル乙] 作品甲 (系列乙)',
  },
  candidate: {
    title: '[Circle Beta] Betarakuyou (Series Beta / Series Beta EN)',
    titleJpn: '[サークル乙] 作品甲 其の弐 (系列乙)',
  },
}).expect('match')
similarity({
  source: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
  candidate: '[Artistalpha.] Work Beta [Spanish] [Some Scans]',
}).expect('match')
similarity({
  source: '[サークル甲] 作品乙 18 (系列甲)',
  candidate: '[サークル甲] 作品乙18 SS (系列甲)',
  creators: 'same',
}).expect('match')

// 只共用一小段文字、或創作者結構相衝突的，落在門檻之下
similarity({
  source: {
    title:
      '[Circle Alpha] Work Alpha (Series Alpha!!) [Thai ภาษาไทย] [Someone] [Decensored]',
    titleJpn: '[サークル甲] Work Alpha (Series Alpha!!) [タイ翻訳] [無修正]',
  },
  candidate:
    '[Someone Else] Work Alpha: The Longer Version Explained [Norwegian]',
}).expect('below')
coreSimilarity({
  left: '(C70) [Gamma Lab (Gamma)] Work Kiss (Kiss Series)',
  right: '(C70) [Delta Seisaku (Delta Person)] Work Kiss. (KissSeries)',
}).expect('below')

// 身分阻擋直接歸零：候選沒有來源的創作者、次要標記自行成立、AI 標記在任一邊
similarityScore({
  source: {
    title: '[Artist Alpha] pixiv fanbox gallery',
    titleJpn: '[作者甲] pixiv fanbox',
  },
  candidate: 'dum pixiv Fanbox Gallery',
}).expect(0)
similarityScore({
  source: {
    title: 'Person Alpha [AI Generated]',
    titleJpn: "Alpha's AI (alphaai)",
  },
  candidate: {
    title: "Beta's Mom [AI Generated]",
    titleJpn: "Alpha's AI (alphaai)",
  },
}).expect(0)
similarityScore({
  source: {
    title: 'person alpha [AI Generated]',
    titleJpn: '[Alpha PATREON更新中] & 12345678',
  },
  candidate: '[Beta] person alpha(75p) (Patreon) (AI Generated)',
}).expect(0)

// 兩個標題欄位對調仍是同一本
similarityScore({
  source: { title: '[Circle] Work Title', titleJpn: '[サークル] 作品名' },
  candidate: { title: '[サークル] 作品名', titleJpn: '[Circle] Work Title' },
}).expect(1)

// 創作者 tag 的裁決覆寫標題裡的身分，兩個方向都算
similarityScore({
  source: '[Circle Beta] Work Beta',
  candidate: '[Artist Alpha] Work Beta [Chinese]',
}).expect(0)
similarityScore({
  source: '[Circle Beta] Work Beta',
  candidate: '[Artist Alpha] Work Beta [Chinese]',
  creators: 'same',
}).expect(1)
similarityScore({
  source: '[Circle Beta] Work Beta',
  candidate: '[Circle Beta] Work Beta [Chinese]',
  creators: 'different',
}).expect(0)

// 創作者 tag 本身的裁決
creatorTags({
  source: ['artist:artist_alpha', 'female:x'],
  candidate: ['artist:artist alpha'],
}).expect('same')
creatorTags({
  source: ['artist:artist alpha'],
  candidate: ['artist:someone else'],
}).expect('different')
creatorTags({
  source: ['artist:artist alpha'],
  candidate: ['female:x'],
}).expect('unknown')
creatorTags({ source: [], candidate: ['artist:artist alpha'] }).expect(
  'unknown',
)

// 分數看不出關係時，作品片語仍讀得出來：各自帶副題的兩部、任一欄位、任一方向
similarity({
  source: '[Circle Alpha] 作品乙 part2 〜副題甲と作品丙〜',
  candidate: '[Circle Alpha] 作品乙 part1 ～副題乙と作品丁～',
  creators: 'same',
}).expect('below')
sharedPhrase({
  source: '[Circle Alpha] 作品乙 part2 〜副題甲と作品丙〜',
  candidate: '[Circle Alpha] 作品乙 part1 ～副題乙と作品丁～',
}).expect(true)
sharedPhrase({
  source: '[Circle Alpha] Work Beta part2',
  candidate: { titleJpn: '[圓環甲] Work Beta part1' },
}).expect(true)
sharedPhrase({
  source: '[Circle Alpha] Work Beta Collection',
  candidate: '[Circle Alpha] Work Beta',
}).expect(true)

// 作品不同、或片語短到不具意義時不算共用
sharedPhrase({
  source: '[Circle Alpha] Work Beta',
  candidate: '[Circle Alpha] Work Gamma',
}).expect(false)
sharedPhrase({
  source: '[Circle Alpha] AB',
  candidate: '[Circle Alpha] AB Something Else',
}).expect(false)

// 沒有單一創作者可縮範圍時，關係要自己過門檻：tag 未定創作者、以及多名創作者的來源
relations({
  source: '[Circle Alpha] 作品乙 part2 〜副題甲と作品丙〜',
  hits: [{ gid: 1, title: '[Circle Alpha] 作品乙 part1 ～副題乙と作品丁～' }],
}).expect({ editions: [], series: [], related: [] })
relations({
  source: {
    title: '[Pixiv] [Artistalpha & Artistbeta] Work Beta (Series Gamma)',
    tags: ['artist:artistalpha', 'artist:artistbeta'],
  },
  hits: [
    {
      gid: 1,
      title: '[Pixiv] [Artistalpha] Work Delta of Epsilon [English]',
      tags: ['artist:artistalpha'],
    },
  ],
}).expect({ editions: [], series: [], related: [] })

// 來源自己被丟掉，分數不足的也留不下，剩下的才是同一本的其他版本
relations({
  source: {
    title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
    tags: ['artist:artistalpha'],
  },
  hits: [
    { gid: 1000, title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)' },
    {
      gid: 2,
      title: '[Artistalpha.] Work Beta [Spanish] [Some Scans]',
      tags: ['language:spanish', 'language:translated'],
    },
    {
      gid: 3,
      title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma) [English]',
      tags: ['language:english', 'language:translated'],
    },
    { gid: 4, title: '[Artistalpha.] Work Beta [中国翻訳]' },
    {
      gid: 5,
      title: '[Someone Else] Work Beta [English]',
      tags: ['language:english'],
    },
  ],
}).expect({ editions: [2, 3, 4], series: [], related: [] })

// 同一話的其他版本，跟系列裡的其他話分開
relations({
  source: {
    title:
      '[Artistalpha] Work Beta Ch. 10 (COMIC Alphabeta Monthly Vol. 40) [English]',
    tags: ['artist:artistalpha'],
  },
  hits: [
    {
      gid: 1,
      title:
        '[Artistalpha] Work Beta Ch.10 (COMIC Alphabeta Monthly Vol. 40) [Chinese]',
    },
    {
      gid: 2,
      title:
        '[Artistalpha] Work Beta Ch. 9 (COMIC Alphabeta Monthly Vol. 39) [English]',
    },
    { gid: 3, title: '[Artistalpha] Work Beta Ch. 1-9 [Korean]' },
    {
      gid: 4,
      title:
        '[Artistalpha] Work Beta 10 | Translated Work Beta Ch. 10 [French]',
    },
    { gid: 5, title: '[Artistalpha] Work Beta Ch. 10 | 作品乙10 [Chinese]' },
  ],
}).expect({ editions: [1, 4, 5], series: [2, 3], related: [] })

relations({
  source: {
    title: '[Artist Alpha] Work Beta #6',
    tags: ['artist:artist_alpha'],
  },
  hits: [
    { gid: 1, title: '[Artist Alpha] Work Beta Ch. 6', tags: ['artist:artist_alpha'] },
    { gid: 2, title: '[Artist Alpha] Work Beta #7', tags: ['artist:artist_alpha'] },
  ],
}).expect({ editions: [1], series: [2], related: [] })

// 同一創作者、標題在括號裡點名了這部作品的，算系列；tag 或標題的創作者區塊都算數。
// 同一創作者但沒有任何關係成立的那本，在固定範圍裡落到 related
relations({
  source: {
    title:
      '(C61) [Circle Alpha (Artist Alpha)] Work Beta 3 (Series Gamma) [Chinese]',
    tags: ['artist:artist_alpha', 'group:circle_alpha'],
  },
  hits: [
    {
      gid: 1,
      title:
        '[Circle Alpha (Artist Alpha)] Work Delta (Work Beta 3 Collection) (Series Gamma) [Chinese]',
      tags: ['artist:artist_alpha'],
    },
    {
      gid: 2,
      title:
        '[Circle Alpha (Artist Alpha)] Work Delta (Work Beta 3 Collection) (Series Gamma) [Chinese]',
    },
    {
      gid: 3,
      title:
        '[Someone Else] Work Delta (Work Beta 3 Collection) (Series Gamma) [Chinese]',
    },
    {
      gid: 4,
      title:
        '[Circle Alpha (Artist Alpha)] Work Epsilon (Series Gamma) [Chinese]',
      tags: ['artist:artist_alpha'],
    },
  ],
}).expect({ editions: [], series: [1, 2], related: [4] })

// 用自己的標題切片去搜同一個人的書架：寫成散文的續作一個片語都沒共用，關係未經證實
relations({
  source: {
    title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
    tags: ['artist:artistalpha'],
  },
  hits: [
    {
      gid: 1,
      title: '[Pixiv] [Artistalpha] Work Delta of Epsilon [English]',
      tags: ['artist:artistalpha'],
    },
  ],
}).expect({ editions: [], series: [], related: [1] })

// related 帶著真實分數，所以證實過的列排在它上面
relatedScores({
  source: {
    title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
    tags: ['artist:artistalpha'],
  },
  hits: [
    {
      gid: 1,
      title: '[Pixiv] [Artistalpha] Work Delta of Epsilon [English]',
      tags: ['artist:artistalpha'],
    },
  ],
}).expect(['below'])

// 固定範圍裡照樣證得出版本與系列
relations({
  source: {
    title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
    tags: ['artist:artistalpha'],
  },
  hits: [
    { gid: 1, title: '[Artistalpha] Work Beta (Series Gamma) [Chinese]' },
    { gid: 2, title: '[Artistalpha] Work Beta 2 (Series Gamma) [Chinese]' },
  ],
}).expect({ editions: [1], series: [2], related: [] })

// tag 定下創作者之後，共用片語就足以收下系列的另一部
relations({
  source: {
    title: '[Circle Alpha] 作品乙 part2 〜副題甲と作品丙〜',
    tags: ['group:circle_alpha'],
  },
  hits: [
    {
      gid: 1,
      title: '[Circle Alpha] 作品乙 part1 ～副題乙と作品丁～',
      tags: ['group:circle_alpha'],
    },
  ],
}).expect({ editions: [], series: [1], related: [] })

// 改筆名的同一人算版本，tag 指向別人的擋掉，AI 生成的整列不收
relations({
  source: {
    title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
    tags: ['artist:artistalpha'],
  },
  hits: [
    {
      gid: 1,
      title: '[Artist Alpha] Work Beta [Chinese]',
      tags: ['language:chinese', 'language:translated', 'artist:artistalpha'],
    },
  ],
}).expect({ editions: [1], series: [], related: [] })
relations({
  source: {
    title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
    tags: ['artist:artistalpha'],
  },
  hits: [
    {
      gid: 1,
      title: '[Artistalpha] Work Beta [Chinese]',
      tags: ['language:chinese', 'artist:someone else'],
    },
  ],
}).expect({ editions: [], series: [], related: [] })
relations({
  source: {
    title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
    tags: ['artist:artistalpha'],
  },
  hits: [
    {
      gid: 1,
      title: '[Artistalpha] Work Beta [Chinese]',
      tags: ['language:chinese', 'artist:artistalpha', 'other:ai_generated'],
    },
  ],
}).expect({ editions: [], series: [], related: [] })

// 直接走 tag 的搜尋：主機已經決定這些列屬於這裡，標題像不像都留著
relations({
  source: {
    title: '[Studio Alpha] Set Beta (Character Gamma)',
    tags: ['cosplayer:name alpha'],
  },
  hits: [
    { gid: 1, title: '[Studio Alpha] Set Delta (Character Epsilon)' },
    { gid: 2, title: '[Studio Zeta] 写真集乙 (角色丙)' },
  ],
}).expect({ editions: [], series: [], related: [1, 2] })

// 同一套在別的 gid 下再貼一次：整句一字不差的就是讀者眼前這本，大小寫與全形不算差別
relations({
  source: {
    title: '[Studio Alpha] Set Beta (Character Gamma)',
    tags: ['cosplayer:name alpha'],
  },
  hits: [
    { gid: 1, title: '[Studio Alpha] SET BETA （Character Gamma）' },
    { gid: 2, title: '[Studio Alpha] Set Beta (Character Gamma) [Digital]' },
  ],
}).expect({ editions: [], series: [], related: [2] })

// 原文標題也算，兩個欄位交叉比；只有原文標題不同的那本留著
relations({
  source: {
    title: '[Studio Alpha] Set Beta',
    titleJpn: '[スタジオ甲] 写真集乙',
    tags: ['cosplayer:name alpha'],
  },
  hits: [
    { gid: 1, title: '[スタジオ甲] 写真集乙' },
    { gid: 2, titleJpn: '[スタジオ甲] 写真集丙' },
  ],
}).expect({ editions: [], series: [], related: [2] })

// 空的欄位不算相等：來源沒有原文標題，候選沒有羅馬字標題，兩邊都還在
relations({
  source: { title: '[Studio Alpha] Set Beta', tags: ['cosplayer:name alpha'] },
  hits: [
    { gid: 1, titleJpn: '[スタジオ甲] 写真集丁' },
    { gid: 2, title: '', titleJpn: '' },
  ],
}).expect({ editions: [], series: [], related: [1, 2] })

// 比整句以外的東西都會少看：只差第幾本的是另一本，只差攝影團體與作品區塊的也是
relations({
  source: {
    title: '[Studio Alpha] Set Beta vol. 1 (Character Gamma)',
    tags: ['cosplayer:name alpha'],
  },
  hits: [
    { gid: 1, title: '[Studio Alpha] Set Beta vol. 2 (Character Gamma)' },
    { gid: 2, title: '[Studio Zeta] Set Beta vol. 1 (Character Delta)' },
  ],
}).expect({ editions: [], series: [], related: [1, 2] })

// 來源自己與重複的 gid 照樣丟掉，第一次出現的順序留著
relations({
  source: { title: '[Studio Alpha] Set Beta', tags: ['cosplayer:name alpha'] },
  hits: [
    { gid: 1000, title: '[Studio Alpha] Set Epsilon' },
    { gid: 2, title: '[Studio Alpha] Set Delta' },
    { gid: 2, title: '[Studio Alpha] Set Delta [Digital]' },
  ],
}).expect({ editions: [], series: [], related: [2] })

// 沒有 cosplayer tag 的那條直接路線同樣照單全收：創作者不相干、分數再低、
// 連整句一樣的都留著——那裡的標題本來就會重複
relations({
  source: { title: 'Identity Alpha Session Beta', tags: ['other:realporn'] },
  hits: [
    {
      gid: 1,
      title: 'Identity Alpha Session Gamma',
      tags: ['artist:someone else'],
    },
    { gid: 2, title: 'Unrelated Delta' },
    { gid: 3, title: 'Identity Alpha Session Beta' },
  ],
}).expect({ editions: [], series: [], related: [1, 2, 3] })

// 這些列沒有分數可言，讀者看到的也就不是百分比
relatedScores({
  source: { title: '[Studio Alpha] Set Beta', tags: ['cosplayer:name alpha'] },
  hits: [{ gid: 1, title: '[Studio Alpha] Set Delta' }],
}).expect(['unscored'])

// 同一本書的多個 release 併在一起，不同本分開；換創作者就是另一本
releaseGroups({
  hits: [
    { gid: 1, title: '[Circle Alpha] Work Beta 1 [Chinese] [Alpha Scans]' },
    {
      gid: 2,
      title:
        '[Circle Alpha] Work Beta 1 [Chinese] [Beta Scans] [Decensored] [38P]',
    },
    { gid: 3, title: '[Circle Alpha] Work Beta 2 [Chinese] [Alpha Scans]' },
    { gid: 4, title: '[Circle Omega] Work Beta 1 [Chinese] [Alpha Scans]' },
  ],
}).expect([[1, 2], [3], [4]])

// 直線後的譯名不參與分組，但話數寫在哪一邊都讀得到
releaseGroups({
  hits: [
    { gid: 1, title: '[Circle Alpha] Work Beta [Chinese] [Alpha Scans]' },
    {
      gid: 2,
      title: '[Circle Alpha] Work Beta | 作品乙 [Chinese] [Beta Scans]',
    },
    {
      gid: 3,
      title: '[Circle Alpha] Work Beta | 譯名甲 [Chinese] [Gamma Scans]',
    },
    { gid: 4, title: '[Circle Alpha] Work Beta | 作品乙 1 [Chinese]' },
    { gid: 5, title: '[Circle Alpha] Work Beta | 作品乙 2 [Chinese]' },
  ],
}).expect([[1, 2, 3], [4], [5]])

// 搜尋片語寫起來一樣的兩本：被符號包住的副題，以及話數標記讀不到的第二個數字
releaseGroups({
  hits: [
    { gid: 1, title: '[Circle Alpha] Work Beta ~副題甲~ [Chinese]' },
    {
      gid: 2,
      title: '[Circle Alpha] Work Beta ~副題甲~ [Chinese] [Beta Scans]',
    },
    { gid: 3, title: '[Circle Alpha] Work Beta ~副題乙~ [Chinese]' },
    { gid: 4, title: '[Circle Alpha] Work Gamma Ch. 1 & 4 [Chinese]' },
    { gid: 5, title: '[Circle Alpha] Work Gamma Ch. 1 [Chinese]' },
  ],
}).expect([[1, 2], [3], [4], [5]])

// 兩邊都有話數就照話數排，10 不會排進 1 和 2 之間
releaseOrder({
  hits: [
    { gid: 1, title: '[Circle Alpha] Work Beta 10 [Chinese]', posted: 432000 },
    { gid: 2, title: '[Circle Alpha] Work Beta 2 [Chinese]', posted: 777600 },
    { gid: 3, title: '[Circle Alpha] Work Beta 1 [Chinese]', posted: 604800 },
  ],
}).expect([[3], [2], [1]])

// 前編／後編沒有數字，由上傳時間決定；同一本的 release 也一樣，書跟著最早那個走
releaseOrder({
  hits: [
    {
      gid: 1,
      title: '[Circle Alpha] Work Beta 後編 [Chinese]',
      posted: 345600,
    },
    {
      gid: 2,
      title: '[Circle Alpha] Work Beta 前編 [Chinese]',
      posted: 172800,
    },
    {
      gid: 3,
      title: '[Circle Alpha] Work Beta 前編 [Chinese] [Beta Scans]',
      posted: 86400,
    },
  ],
}).expect([[3, 2], [1]])

// 沒有日期的排最後，不是最前
releaseOrder({
  hits: [
    { gid: 1, title: '[Circle Alpha] Work Beta 前編 [Chinese]', posted: null },
    { gid: 2, title: '[Circle Alpha] Work Beta 後編 [Chinese]', posted: 86400 },
  ],
}).expect([[2], [1]])

// 語言分桶：讀者的語言優先，桶內再分本
languageGroups({
  hits: [
    {
      gid: 1,
      title: '[Circle Alpha] Work Beta [Chinese] [Alpha Scans]',
      tags: ['language:chinese'],
    },
    {
      gid: 2,
      title: '[Circle Alpha] Work Beta [Chinese] [Beta Scans]',
      tags: ['language:chinese'],
    },
    {
      gid: 3,
      title: '[Circle Alpha] Work Beta [English]',
      tags: ['language:english'],
    },
  ],
  priority: ['chinese', 'english'],
}).expect([
  { language: 'chinese', books: [[1, 2]] },
  { language: 'english', books: [[3]] },
])
languageGroups({
  hits: [
    {
      gid: 1,
      title: '[Artistalpha.] Work Beta [Spanish] [Some Scans]',
      tags: ['language:spanish', 'language:translated'],
    },
    {
      gid: 2,
      title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma) [English]',
      tags: ['language:english', 'language:translated'],
    },
    { gid: 3, title: '[Artistalpha.] Work Beta [中国翻訳]' },
  ],
  priority: ['chinese', 'japanese', 'english'],
}).expect([
  { language: 'chinese', books: [[3]] },
  { language: 'english', books: [[2]] },
  { language: 'spanish', books: [[1]] },
])

// 語言判讀：tag 優先，其次標題標記，有 tag 的日文作品才落回日文
language({
  title: '[A] T [English]',
  tags: ['language:chinese', 'language:translated'],
}).expect('chinese')
language({ title: '[A] T [中国翻訳]', tags: [] }).expect('chinese')
language({ title: '[A] T', tags: ['artist:a'] }).expect('japanese')
language({ title: '[A] T', tags: ['artist:a', 'language:translated'] }).expect(
  'unknown',
)
language({ title: '[A] T', tags: [] }).expect('unknown')

// 品質標記：tag id 的底線與空白讀成同一個
flags([
  'language:english',
  'language:rewrite',
  'other:rough translation',
  'artist:artistalpha',
]).expect(['rewrite', 'rough translation'])
flags(['language:english']).expect([])
flags(['other:extraneous_ads']).expect(['extraneous ads'])
flags(['other:extraneous ads', 'language:rewrite']).expect([
  'extraneous ads',
  'rewrite',
])

// 搜尋列沒有 tag，要 metadata 補上之後讀者才看得到語言與品質標記
enrichedEdition({
  hit: { gid: 1, title: '[Artistalpha] Work Beta [English]' },
  metadata: {
    titleJpn: '[作者甲] 作品乙 [英訳]',
    tags: [
      'language:english',
      'language:rewrite',
      'other:rough translation',
      'artist:artistalpha',
    ],
  },
}).expect({ language: 'english', flags: ['rewrite', 'rough translation'] })
