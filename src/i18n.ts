export type Locale = 'en' | 'zh' | 'ja'

export const locale: Locale = (() => {
  const language = navigator.language.toLowerCase()
  if (language.startsWith('zh')) return 'zh'
  if (language.startsWith('ja')) return 'ja'
  return 'en'
})()

const MESSAGES = {
  searching: { en: 'Searching…', zh: '搜尋中…', ja: '検索中…' },
  notFound: { en: 'No results', zh: '未找到', ja: '見つかりません' },
  noTitle: { en: 'No searchable title', zh: '沒有可搜尋的標題', ja: '検索できるタイトルなし' },
  failed: { en: 'Search failed', zh: '搜尋失敗', ja: '検索失敗' },
  partial: { en: 'Some requests failed; results are incomplete', zh: '部分請求失敗，結果不完整', ja: '一部のリクエストに失敗しました。結果は不完全です' },
  networkFailed: { en: 'Network error', zh: '網路錯誤', ja: 'ネットワークエラー' },
  requestTimedOut: { en: 'Request timed out', zh: '請求逾時', ja: 'リクエストがタイムアウトしました' },
  httpFailed: { en: 'HTTP error', zh: 'HTTP 錯誤', ja: 'HTTP エラー' },
  invalidResponse: { en: 'Invalid response', zh: '回應格式異常', ja: '応答の形式が不正です' },
  requestAttempts: { en: 'Attempts', zh: '嘗試次數', ja: '試行回数' },
  container: { en: 'Source', zh: '原刊', ja: '掲載元' },
  containerTitle: { en: 'Magazine or tankoubon this chapter came from', zh: '這一章來自的雜誌或單行本', ja: 'この話の掲載誌・単行本' },
  editionsTitle: { en: 'This book in other languages and releases', zh: '同一本的其他語言／版本', ja: '同じ本の他言語版・別版' },
  series: { en: 'Series', zh: '系列', ja: 'シリーズ' },
  seriesTitle: { en: 'Other books of the same series', zh: '同系列的其他集', ja: '同シリーズの他の巻・話' },
  related: { en: 'Related', zh: '相關作品', ja: '関連作品' },
  relatedTitle: {
    en: 'Same creator and wording, relation unproven',
    zh: '同作者、用詞相同，關係未經確認',
    ja: '同じ作者・同じ語句だが関係は未確認',
  },
  cosplayerRelatedTitle: {
    en: 'Other works by the same cosplayer',
    zh: '同一位 cosplayer 的其他作品',
    ja: '同じコスプレイヤーの他の作品',
  },
  directRelatedTitle: {
    en: 'Results matching the search, without title similarity filtering',
    zh: '符合搜尋條件的結果，不以標題相似度篩選',
    ja: '検索条件に一致した結果、タイトル類似度による絞り込みなし',
  },
  chapters: { en: 'Chapters', zh: '收錄作品', ja: '収録作品' },
  chaptersTitle: { en: 'Chapters cut from this magazine or tankoubon', zh: '從這本雜誌或單行本切出來的作品', ja: 'この掲載誌・単行本から切り出された作品' },
  requestsTitle: { en: 'URLs this script requested for this gallery', zh: '這個腳本為這本畫廊發出的請求', ja: 'このギャラリーのために送ったリクエスト' },
  searchRequests: { en: 'Search pages', zh: '搜尋頁', ja: '検索ページ' },
  searchHits: { en: 'Hits', zh: 'Hits', ja: 'Hits' },
  searchHitsTitle: {
    en: 'Galleries returned on this search page, before filtering',
    zh: '此搜尋頁回傳的圖庫數，篩選前',
    ja: 'この検索ページで取得したギャラリー数（絞り込み前）',
  },
  noRequests: { en: 'Nothing was requested', zh: '一次請求都沒有發出', ja: 'リクエストは送っていません' },
  nothingSent: { en: 'Nothing left the browser; every response came from the cache', zh: '沒有發出任何請求，全部來自快取', ja: 'リクエストは送らず、すべてキャッシュから' },
  fromCache: { en: 'from cache', zh: '來自快取', ja: 'キャッシュから' },
  dataAsOf: { en: 'As of', zh: '資料時間', ja: 'データ時点' },
  refetch: { en: 'Refetch', zh: '重新抓取', ja: '再取得' },
  refetchTitle: {
    en: 'Discard the cached responses for this gallery and ask the host again',
    zh: '丟掉這本的快取，重新向站方請求',
    ja: 'このギャラリーのキャッシュを破棄して再取得',
  },
  pages: { en: 'p', zh: '頁', ja: 'ページ' },
  copyLink: { en: 'Copy gallery link', zh: '複製畫廊網址', ja: 'ギャラリーのリンクをコピー' },
  linkCopied: { en: 'Link copied', zh: '已複製網址', ja: 'リンクをコピーしました' },
  rewrite: { en: 'rewrite', zh: '重寫', ja: 'リライト' },
  roughTranslation: { en: 'rough translation', zh: '粗譯', ja: '粗訳' },
  extraneousAds: { en: 'extraneous ads', zh: '外部廣告', ja: '広告混入' },
  settings: { en: 'Settings', zh: '設定', ja: '設定' },
  settingGroupDisplay: { en: 'Display', zh: '顯示', ja: '表示' },
  settingGroupSearch: { en: 'Gallery search', zh: '畫廊搜尋', ja: 'ギャラリー検索' },
  settingGroupAdvanced: { en: 'Advanced', zh: '進階', ja: '詳細' },
  decrease: { en: 'Decrease', zh: '減少', ja: '減らす' },
  increase: { en: 'Increase', zh: '增加', ja: '増やす' },
  settingShowExcludedLanguages: { en: 'Show languages excluded in E-Hentai settings', zh: '顯示 E-Hentai 設定中排除的語言', ja: 'E-Hentai の設定で除外した言語を表示' },
  settingView: { en: 'View', zh: '檢視', ja: '表示' },
  settingMaxRequests: { en: 'Max searches per gallery', zh: '每個畫廊最多搜尋次數', ja: 'ギャラリーごとの最大検索回数' },
  viewList: { en: 'List', zh: '清單', ja: 'リスト' },
  viewCovers: { en: 'Covers', zh: '封面', ja: '表紙' },
  pagingPerksTitle: {
    en: 'Paging Enlargement',
    zh: 'Paging Enlargement',
    ja: 'Paging Enlargement',
  },
  pagingPerksDescription: {
    en: 'Purchase this perk to reduce the number of requests.',
    zh: '可購買此 perk 以減少請求次數。',
    ja: 'この特典を購入すると、リクエスト回数を減らせます。',
  },
  pagingPerkI: {
    en: 'I: 50/page · 500 Hath',
    zh: 'I：50 筆／頁 · 500 Hath',
    ja: 'I：50件/ページ · 500 Hath',
  },
  pagingPerkII: {
    en: 'II: 100/page · +1,000 Hath',
    zh: 'II：100 筆／頁 · +1,000 Hath',
    ja: 'II：100件/ページ · +1,000 Hath',
  },
  hathPerks: { en: 'Hath Perks', zh: 'Hath Perks', ja: 'Hath Perks' },
  pagingPerksDetails: { en: 'Details', zh: '說明', ja: '詳細' },
  search: { en: 'Search', zh: '搜索', ja: '検索' },
  searchTitle: {
    en: 'Search Google, DLsite and pixiv for this gallery and list the results here',
    zh: '用這本的標題、社團、作者搜 Google、DLsite、pixiv，結果列在這裡',
    ja: 'このギャラリーで Google、DLsite、pixiv を検索し、結果をここに表示',
  },
  close: { en: 'Close', zh: '關閉', ja: '閉じる' },
  termTitle: { en: 'Title', zh: '標題', ja: 'タイトル' },
  termWork: { en: 'Work', zh: '作品', ja: '作品' },
  termCircle: { en: 'Circle', zh: '社團', ja: 'サークル' },
  termArtist: { en: 'Artist', zh: '作者', ja: '作家' },
  previewPage: { en: 'Page {n}', zh: '第 {n} 頁', ja: '{n} ページ目' },
  previewNextPage: { en: 'Next page', zh: '下一頁', ja: '次のページ' },
  settingDebug: { en: 'Debug log for searches', zh: '搜索的除錯 log', ja: '検索のデバッグログ' },
  debugLog: { en: 'Log', zh: 'Log', ja: 'ログ' },
  debugCopy: { en: 'Copy', zh: '複製', ja: 'コピー' },
  debugClear: { en: 'Clear', zh: '清除', ja: 'クリア' },
  debugEmpty: { en: 'Nothing logged yet', zh: '還沒有任何紀錄', ja: 'まだ記録がありません' },
  copyResultLink: { en: 'Copy link', zh: '複製網址', ja: 'リンクをコピー' },
  previewLoading: { en: 'Loading the search in a background tab…', zh: '正在背景分頁打開搜尋…', ja: 'バックグラウンドのタブで検索を読み込み中…' },
  previewTimeout: { en: 'The background tab did not answer in time', zh: '背景分頁沒有及時回應', ja: 'バックグラウンドのタブから時間内に応答がありません' },
  previewEmpty: { en: 'No results', zh: '沒有搜尋結果', ja: '検索結果がありません' },
  previewUnreadable: {
    en: 'The page showed no results to read; it may want an age check or a sign-in, so open the search itself',
    zh: '頁面上讀不到結果，可能要先確認年齡或登入；請直接打開那個搜尋',
    ja: 'ページから結果を読めませんでした。年齢確認かログインが必要かもしれません。検索ページを直接開いてください',
  },
  previewBlocked: { en: 'The site asked to verify you are not a robot; open the search to continue', zh: '網站要求驗證不是機器人；請直接打開搜尋頁處理', ja: 'サイトがロボット確認を求めています。検索ページを開いて続けてください' },
  previewClosed: {
    en: 'The background tab was closed before it answered; another extension may be closing new tabs (a tab limit?)',
    zh: '背景分頁還沒回答就被關掉了；可能是其他擴充套件關掉了新分頁（例如分頁數上限）',
    ja: 'バックグラウンドのタブが応答前に閉じられました。他の拡張機能が新しいタブを閉じているかもしれません（タブ数の上限など）',
  },
  previewUnavailable: {
    en: 'The userscript manager does not let this script open tabs; reinstall the script',
    zh: '腳本管理器沒有讓這個腳本開分頁；請重新安裝腳本',
    ja: 'スクリプトマネージャーがタブを開く権限を渡していません。スクリプトを再インストールしてください',
  },
} as const

export type MessageKey = keyof typeof MESSAGES

export function t(key: MessageKey): string {
  return MESSAGES[key][locale]
}

/** Language priority follows the UI locale: the reader's own language first. */
export const LANGUAGE_PRIORITY: Record<Locale, readonly string[]> = {
  zh: ['chinese', 'japanese', 'english'],
  ja: ['japanese', 'english', 'chinese'],
  en: ['english', 'japanese', 'chinese'],
}
