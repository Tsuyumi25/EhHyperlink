import { search } from './plan'
import {
  blockMarker,
  bracketsBalanced,
  numeralValue,
  partCounter,
  phraseInsideSegment,
  titleReads,
  workAndPart,
  workPhrase,
  workRuns,
  workText,
  wrappedSubtitles,
} from './title'

// 以下標題皆為虛構。

// 全角與轉角括號變體
workText('［Circle］ 「Work Title」 （Series） ［English］').expect(
  'work title',
)

// 書名號內容照樣進搜尋片語
workText('『人生』 《第二章》').expect('人生 第二章')

// 兩種角括號都讀作語境：語料把標記放在裡面，片語不能帶著它
workRuns('[Circle Alpha] Work Beta <Zenpen>').expect(['Work Beta'])
workRuns('[圓環甲] 作品乙〈前編〉').expect(['作品乙'])
workRuns('[圓環甲] 作品乙 <前編>').expect(['作品乙'])

// 被標記表認領的區塊既不進片語也不進語境；書名號永遠不送去認領
titleReads('[Circle Alpha] Work Beta <English>').expect({
  coreSegments: ['Work Beta'],
  context: '',
})
blockMarker('English').expect({ role: 'language', lang: 'english' })

// 沒收尾的 `<` 就是括號不成對，和任何未閉合括號一樣
bracketsBalanced('I <3 U 2').expect(false)

// 巢狀的身分資訊丟掉
workText('[Circle (Artist)] Work Title').expect('work title')

// 括號不成對時保守處理
workText('[Broken Title').expect('broken title')
bracketsBalanced('[Broken Title').expect(false)

// 每個支援的括號對都能包出作品名
workText('[Only Title]').expect('only title')
workText('［Only Title］').expect('only title')
workText('(Only Title)').expect('only title')
workText('（Only Title）').expect('only title')
workText('{Only Title}').expect('only title')
workText('｛Only Title｝').expect('only title')
workText('【Only Title】').expect('only title')
workText('「Only Title」').expect('only title')
workText('『Only Title』').expect('only title')
workText('《Only Title》').expect('only title')
workText('〈Only Title〉').expect('only title')
workText('<Only Title>').expect('only title')
workText('〔Only Title〕').expect('only title')
workText('｢Only Title｣').expect('only title')
workText('〖Only Title〗').expect('only title')
workText('〝Only Title〟').expect('only title')
workText('︵Only Title︶').expect('only title')
workText('༼Only Title༽').expect('only title')
workText('༺Only Title༻').expect('only title')
workText('⟮Only Title⟯').expect('only title')
workText('₍Only Title₎').expect('only title')
workText('❲Only Title❳').expect('only title')
workText('❬Only Title❭').expect('only title')
workText('❰Only Title❱').expect('only title')
workText('⟨Only Title⟩').expect('only title')
workText('⟪Only Title⟫').expect('only title')
workText('﹙Only Title﹚').expect('only title')
workText('〘Only Title〙').expect('only title')
workText('﴿Only Title﴾').expect('only title')
workText('⁽Only Title⁾').expect('only title')
workText('﹃Only Title﹄').expect('only title')

// 頂層文字各段照原樣分開
titleReads(
  '[Circle Alpha] Work Alpha (Series Alpha!!) [Thai ภาษาไทย] [Decensored]',
).expect({
  coreSegments: ['Work Alpha'],
  core: 'work alpha',
  contextText: 'Series Alpha!!',
})

// 括號區塊隔開的兩段永遠不接起來：標題寫的是區塊前 `Work Alpha`、區塊後 `7.6 MB`，
// 沒有畫廊把兩者並排，片語也不能自己造一個
workRuns(
  '[Circle Alpha] Work Alpha (Series Beta) [Chinese] [DL版]7.6 MB',
).expect(['Work Alpha', '7.6 MB'])

// 同一個鏡像符號緊貼包住的區塊只退出搜尋：副標、段名、平台標、掃圖署名，從來不是作品本身
workRuns('[Circle Alpha] Work Beta ~作品乙~').expect(['Work Beta'])
workRuns('[Circle Alpha] Work Beta -Gamma-').expect(['Work Beta'])
workRuns('[Circle Alpha] ★Signature★ Work Beta').expect(['Work Beta'])

// 評分仍然看得到整段寫出來的作品名
workText('[Circle Alpha] Work Beta ~作品乙~').expect('work beta 作品乙')

// 兩側都有文字的包裹要留著：`刊名 ～副標～ 2` 接成 `刊名 2` 是沒有畫廊叫的名字
workRuns('[Circle Alpha] Work Beta ~作品乙~ 2').expect(['Work Beta ~作品乙~ 2'])
workRuns('[Circle Alpha] Work Beta -Gamma- Vol. 24').expect([
  'Work Beta -Gamma- Vol. 24',
])

// 搜尋留著它，分組還是照樣收集
wrappedSubtitles('[Circle Alpha] Work Beta ~作品乙~ 2').expect(['作品乙'])

// 包裹就是整段作品名時留著
workRuns('[Circle Alpha] ~作品乙~').expect(['~作品乙~'])
workRuns('[Circle Alpha] -Work Beta-').expect(['-Work Beta-'])

// 分隔而不是包裹的符號留著：鬆散的空白代表分隔，`|` 切開翻譯標題
workRuns('[Circle Alpha] Work Beta - Gamma -').expect(['Work Beta - Gamma -'])
workRuns('[Circle Alpha] Work Beta | 作品乙').expect(['Work Beta | 作品乙'])

// 平台區塊不會變成創作者身分
titleReads(
  '[Pixiv] [Artist Alpha] Alpha-sensei (Series Beta -Serib-) [Chinese] [某某個人翻譯]',
).expect({
  identity: 'artist alpha',
  core: 'alpha sensei',
  context: 'series beta serib',
})

// 創作者加系列、沒有作品文字時，作品名是空的
titleReads('[Circle Beta] (Series Beta)').expect({
  identity: 'circle beta',
  core: '',
  context: '',
})

// 事件與翻譯標記在任何括號裡都被認領
titleReads('[C81] Work Title [Japanese] (某某汉化组)').expect({
  identity: '',
  core: 'work title',
  context: '',
})

// 事件詞幹後面要有數字再接邊界
blockMarker('SC2016 Winter').expect({ role: 'event' })
blockMarker("Bang Dreamer's Party! 4th Stage").expect({ role: 'event' })
blockMarker('C104 Day 2').expect({ role: 'event' })
blockMarker('FF7SFM').expect(null)
blockMarker('C17H18F3NO').expect(null)

// 標記指出的語言
blockMarker('英訳').expect({ role: 'language', lang: 'english' })
blockMarker('中国翻訳').expect({ role: 'language', lang: 'chinese' })
blockMarker('Thai ภาษาไทย').expect({ role: 'language', lang: 'thai' })
blockMarker('Decensored').expect({ role: 'release' })

// CJK 數字：兩種語言一致的單位寫法
numeralValue('零').expect(0)
numeralValue('一').expect(1)
numeralValue('十').expect(10)
numeralValue('十一').expect(11)
numeralValue('一十一').expect(11)
numeralValue('二十').expect(20)
numeralValue('二十三').expect(23)
numeralValue('一百').expect(100)
numeralValue('一百零一').expect(101)
numeralValue('一百一十').expect(110)
numeralValue('一百一十一').expect(111)
numeralValue('廿二').expect(22)
numeralValue('卅').expect(30)

// 位數連寫、大字與異體字
numeralValue('一〇二').expect(102)
numeralValue('一二三').expect(123)
numeralValue('弐').expect(2)
numeralValue('壹拾壹').expect(11)
numeralValue('参').expect(3)
numeralValue('兩').expect(2)

// 兩種語言讀法不同時取日文讀法
numeralValue('百二').expect(102)
numeralValue('一百二').expect(102)

// 不成計數的連寫拒掉
numeralValue('').expect(null)
numeralValue('十十').expect(null)
numeralValue('十百').expect(null)
numeralValue('千').expect(null)
numeralValue('一二三四').expect(null)
numeralValue('二廿').expect(null)
numeralValue('一百二十三十').expect(null)

// ehwiki 的章、卷寫法，不論位置都脫落
workPhrase('Work Gamma Ch. 1-7').expect('Work Gamma')
workPhrase('作品丙 第1-7話').expect('作品丙')
workPhrase('Work Gamma Vol. 8').expect('Work Gamma')
workPhrase('作品丙 第8巻').expect('作品丙')
workPhrase('Work Gamma Ch.3').expect('Work Gamma')
workPhrase('Chapter 3 Alpha Beta').expect('Alpha Beta')

workAndPart('Work Beta #6').expect({ phrase: 'Work Beta', counter: '6' })
workAndPart('作品乙#6').expect({ phrase: '作品乙', counter: '6' })
workAndPart('#6 Work Beta').expect({ phrase: 'Work Beta', counter: '6' })
workAndPart('Work Beta # 6.5 Subtitle Alpha').expect({ phrase: 'Work Beta', counter: '6.5' })
workAndPart('Work Beta #1-6').expect({ phrase: 'Work Beta', counter: '1-6' })
workAndPart('Work Beta #6Gamma').expect({ phrase: 'Work Beta #6Gamma', counter: '' })
workAndPart('Work Beta #2025').expect({ phrase: 'Work Beta #2025', counter: '' })

// 語料統計出的其他計數標籤
workAndPart('Work Beta part2').expect({ phrase: 'Work Beta', counter: '2' })
workPhrase('Work Beta - part 1').expect('Work Beta')
workPhrase('Work Beta PART2').expect('Work Beta')
workPhrase('Work Beta pt1').expect('Work Beta')
workPhrase('Work Beta ep.3').expect('Work Beta')
workAndPart('Work Beta Episode 20').expect({
  phrase: 'Work Beta',
  counter: '20',
})
workPhrase('Work Beta Image Set 2').expect('Work Beta Image')

// sono 是 其の 的轉寫，只有轉寫欄位會這樣寫
workPhrase('Work Beta sono 3').expect('Work Beta')

// 標籤前面接著字母就是在詞裡面
workPhrase('Work Sunset 3').expect('Work Sunset')
workPhrase('Work Partner 2').expect('Work Partner')

// 標籤後面也要有數字
workPhrase('Work Beta Part Two').expect('Work Beta Part Two')

// 尾端的裸號碼脫落，含小數
workPhrase('作品丁を教えて! 5').expect('作品丁を教えて')
workPhrase('作品丁を教えて! 05').expect('作品丁を教えて')
workPhrase('Alpha x Beta x Gamma 3').expect('Alpha x Beta x Gamma')
workPhrase('Alpha x Beta x Gamma 4.5').expect('Alpha x Beta x Gamma')
workPhrase('作品丁のほん5').expect('作品丁のほん')
workPhrase('作品丁本子5').expect('作品丁本子')
workPhrase('Alpha5').expect('Alpha5')
workPhrase('唯一').expect('唯一')
workPhrase('Work Delta 2.0').expect('Work Delta')
workPhrase('Work Gamma Ch. 4.5').expect('Work Gamma')
workPhrase('作品丙 第4.5話').expect('作品丙')
workPhrase('Volume Trader').expect('Volume Trader')
workPhrase('Route 2024').expect('Route 2024')
workPhrase('Version 1.2.3').expect('Version 1.2.3')
workPhrase('7').expect('7')

// 一段連續號碼脫落，不論標題用哪種破折號寫
workAndPart('Work Beta 1~36').expect({ phrase: 'Work Beta', counter: '1~36' })
workPhrase('Work Beta 1-36').expect('Work Beta')
workPhrase('Work Beta 1–36').expect('Work Beta')
workPhrase('Work Beta 1—36').expect('Work Beta')
workPhrase('Work Beta 1－36').expect('Work Beta')
workPhrase('作品乙 1~36').expect('作品乙')
workPhrase('作品丙 第72~74話').expect('作品丙')

// 全角波浪號也當群組分隔，到得了同一批標題
workPhrase('作品乙 1〜36').expect('作品乙')

// 逗號是列舉不是連續，四位數也不是計數
workPhrase('Work Beta 1,2,3').expect('Work Beta 1,2,3')
workPhrase('Work Beta 2007.1~12').expect('Work Beta 2007.1~12')

// CJK 數字計數讀得出來，不是數字的漢字連寫不動
workPhrase('作品丙 第三話').expect('作品丙')
workPhrase('作品丙 第十二巻').expect('作品丙')
workPhrase('作品丙 第一百零二话').expect('作品丙')
workPhrase('作品丙 弐').expect('作品丙')
workPhrase('作品丙 十十').expect('作品丙 十十')
workPhrase('第三話').expect('')

// 尾端的羅馬數字脫落，X 形式保留
workPhrase('Work Gamma II').expect('Work Gamma')
workPhrase('Work Gamma iv').expect('Work Gamma')
workPhrase('Work Gamma X').expect('Work Gamma X')
workPhrase('Work Gamma XXX').expect('Work Gamma XXX')
workPhrase('Work Gammavii').expect('Work Gammavii')

// 系列詞當群組尾時脫落，副標不脫落
workPhrase('作品丙 後編').expect('作品丙')
workPhrase('作品丙 上巻').expect('作品丙')
workPhrase('作品丙 総集編').expect('作品丙')
workPhrase('作品丙 花').expect('作品丙 花')
workPhrase('作品丙・番外篇').expect('作品丙')

// 多字系列詞的字面自己就定了意思，不需要空格
workPhrase('作品丙後編').expect('作品丙')

// 中文與異體寫法讀法相同
workPhrase('作品丙 后篇').expect('作品丙')
workPhrase('作品丙 总集篇').expect('作品丙')

// 單字詞還是要看位置：天下 保住它的 下
workPhrase('作品丙 天下').expect('作品丙 天下')

// 空格隔開、以 編 / 篇 結尾的段名讀作部次號
workAndPart('作品乙の冒険 アイウエ編').expect({
  phrase: '作品乙の冒険',
  counter: 'アイウエ編',
})
workAndPart('作品乙 甲編').expect({ phrase: '作品乙', counter: '甲編' })

// 兩個標記疊著：段名先下來，黏在 乙 後面的號碼跟著下來
workPhrase('作品乙2 保健甲編').expect('作品乙')

// 最右邊的群組決定結果，部次號就是從它身上掉下來的那個
workAndPart('作品乙 ～副題甲～ 丙編').expect({
  phrase: '作品乙～副題甲',
  counter: '丙編',
})

// 認的是形狀，所以要有空格，也要是個會結束的 token
workPhrase('作品乙アイウエ編').expect('作品乙アイウエ編')
workPhrase('作品乙 とてもとてもとても長い題名の編').expect(
  '作品乙 とてもとてもとても長い題名の編',
)

// 躲在省略號後面的裸號碼讀得出來，會一路剝到群組穩定
workAndPart('作品乙に協力したら...2').expect({
  phrase: '作品乙に協力したら',
  counter: '2',
})
workPhrase('作品乙…2').expect('作品乙')
workPhrase('作品乙..2').expect('作品乙')

// 自己就會寫數字的分隔符把數字留著
workPhrase('COMIC Alphabeta Monthly 2002-11').expect(
  'COMIC Alphabeta Monthly 2002-11',
)
workPhrase('作品乙 3／4').expect('作品乙 3／4')

// 另一個標題欄位用漢字寫的系列詞，這裡是轉寫
workAndPart('Work Beta Zenpen').expect({
  phrase: 'Work Beta',
  counter: 'Zenpen',
})
workAndPart('Work Beta Kouhen').expect({
  phrase: 'Work Beta',
  counter: 'Kouhen',
})
workPhrase('Work Beta Gekan').expect('Work Beta')
workPhrase('Work Beta Saishuuwa').expect('Work Beta')

// 後面接數字還是同一個標記
workPhrase('Work Beta Soushuuhen2').expect('Work Beta')
workPhrase('Work Beta-Soushuuhen-').expect('Work Beta')

// 兩側任一邊接著字母就是詞的一部分
workPhrase('Work Beta Kouhentai').expect('Work Beta Kouhentai')
workPhrase('Work Kouhenbeta').expect('Work Kouhenbeta')

// 在語料門檻以下，刻意不收
workPhrase('Work Beta Kanketsuhen').expect('Work Beta Kanketsuhen')
workPhrase('Work Beta Honpen').expect('Work Beta Honpen')
workPhrase('Work Beta Chuukan').expect('Work Beta Chuukan')

// 標記在任一群組的尾端都讀得到，不只是整段文字的尾端；
// 標記後面的標點不再擋住它，被清空的群組把自己的分隔符一起帶走
workPhrase('作品乙 後編。').expect('作品乙')
workPhrase('作品甲、作品乙。2').expect('作品甲、作品乙')

// 標記前面的標點也不再擋住它
workPhrase('作品甲・作品乙・後編').expect('作品甲・作品乙')
workPhrase('作品甲〜作品乙〜後編').expect('作品甲〜作品乙')
workPhrase('作品乙・上').expect('作品乙')

// 複合詞的最後一個字前面既沒有空格也沒有標點
workPhrase('作品乙、天下').expect('作品乙、天下')
workPhrase('作品乙。改造').expect('作品乙。改造')

// `ー` 依字元分類算字母，黏在它後面的計數還是讀作計數；
// 但在邊緣上它不帶作品文字，和其他符號一起被修掉
workPhrase('作品乙ー後編ー').expect('作品乙')
workPhrase('作品乙カラー9').expect('作品乙カラ')

// 邊緣的標點跟著一起走：其他語言的版本標點方式不同
workPhrase('作品乙。').expect('作品乙')

// 切在第一個標記，保留作品那一側
workPhrase('作品乙 第3話 副題甲').expect('作品乙')

// 好幾個標記時，第一個就已經結束作品名
workPhrase('Work Beta Vol. 2 - Ch. 1-6').expect('Work Beta')

// 標記開頭的段落只剩右邊那側
workPhrase('Chapter 3 Work Beta').expect('Work Beta')

// 兩個 token 之間單獨站著的號碼也是切點
workPhrase('作品乙 四 副題甲の話').expect('作品乙')
workPhrase('Work Beta 4 Subtitle Gamma').expect('Work Beta')
partCounter('作品乙 弐 副題甲').expect('弐')

// 號碼在尾端是群組尾，不是切點
workPhrase('作品乙 四').expect('作品乙')

// 黏在詞上兩者都不是：14 留在作品文字裡
workPhrase('Work Beta14 Gamma').expect('Work Beta14 Gamma')

// 會只剩一個字的切法不切
workPhrase('A 4 Work Beta').expect('Work Beta')

// 片語永遠是原段落的子字串，來源自己搜得到自己
phraseInsideSegment('Work Beta Vol. 02 Gamma').expect(true)
phraseInsideSegment('作品乙 第3話 副題甲').expect(true)
phraseInsideSegment('Work Beta Vol. 2 - Ch. 1-6').expect(true)
phraseInsideSegment('作品乙。2').expect(true)
phraseInsideSegment('Work Beta 5').expect(true)

// 沒有標籤時退回群組尾
workPhrase('Work Beta 5').expect('Work Beta')
workPhrase('作品乙。2').expect('作品乙')
workAndPart('Work Beta').expect({ phrase: 'Work Beta', counter: '' })

// 部次號是標籤脫落後剩下的東西：同一部的兩種語言副標不同，部次號相同
workAndPart('Work Beta Vol. 02 Gamma').expect({
  phrase: 'Work Beta',
  counter: '02',
})
workAndPart('Work Beta Vol. 02 副題甲').expect({
  phrase: 'Work Beta',
  counter: '02',
})

// 標籤掉出去以後，`Ch. 10` 和裸的 `10` 一致
partCounter('Work Beta Ch. 10').expect('10')
partCounter('Work Beta 10').expect('10')
partCounter('作品乙 第3話').expect('3')
partCounter('作品乙 第十二巻').expect('十二')

// 系列詞是自己的部次號，所以 前編 和 後編 讀作不同的部
partCounter('作品乙 前編').expect('前編')
partCounter('作品乙 後編').expect('後編')

// 多位作者保留完整詞句，兩個標題欄位都參與搜尋。
search({
  title: '[Pixiv] [Artistalpha] Work Beta (Series Gamma)',
  titleJpn: '[作者甲] 作品乙',
  tags: ['artist:artistalpha', 'artist:artistbeta'],
}).expect({
  editionTerms: ['Work Beta', '作品乙'],
  containerTerms: [],
  fixedRange: false,
})
search({
  title: '[Circle Alpha] Work Beta Kouhen',
  titleJpn: '[圓環甲] 作品乙 後編',
  tags: ['artist:artistalpha', 'artist:artistbeta'],
}).expect({ editionTerms: ['Work Beta', '作品乙'], fixedRange: false })

// 純數字不搜尋；譯名分隔線兩側各自移除章節標記。
search({
  title: '[Artist] 2 (Parody)',
  titleJpn: '[作者] 2',
  tags: ['artist:artistalpha'],
}).expect({ editionTerms: [], fixedRange: false })
search('Work Beta 2 | Work Beta Translated Ch. 2').expect({
  editionTerms: ['Work Beta', 'Work Beta Translated'],
  fixedRange: false,
})
search({
  category: 'Manga',
  title: '[Artist Alpha] Work Gamma Ch. 1-7 [Korean] [Some Team]',
  titleJpn: '[作者甲] 作品丙 第1-7話 [韓国翻訳]',
  tags: ['artist:artistalpha', 'artist:artistbeta'],
}).expect({ editionTerms: ['Work Gamma', '作品丙'], fixedRange: false })

// 多位作者使用 OR 範圍；沒有作者資料時仍可搜尋完整詞句。
search({
  title: 'Work Beta',
  tags: ['group:circle_alpha', 'artist:artist_alpha', 'artist:artist_beta'],
}).expect({
  scope: '~g:"circle alpha$" ~a:"artist alpha$" ~a:"artist beta$"',
  fixedRange: false,
})
search({ title: 'Work Beta', tags: ['female:x'] }).expect({
  scope: '',
  fixedRange: false,
})
search('[Pixiv] [Artistalpha] Work Beta (Series Gamma)').expect({
  scope: '',
  fixedRange: false,
})
