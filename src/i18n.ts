export type Locale = 'en' | 'zh' | 'ja'

export const locale: Locale = (() => {
  const language = navigator.language.toLowerCase()
  if (language.startsWith('zh')) return 'zh'
  if (language.startsWith('ja')) return 'ja'
  return 'en'
})()

const MESSAGES = {
  searching: { en: 'Searching…', zh: '搜尋中…', ja: '検索中…' },
  notFound: { en: 'No other editions', zh: '未找到', ja: '見つかりません' },
  noTitle: { en: 'No searchable title', zh: '沒有可搜尋的標題', ja: '検索できるタイトルなし' },
  failed: { en: 'Search failed', zh: '搜尋失敗', ja: '検索失敗' },
  container: { en: 'Source', zh: '原刊', ja: '掲載元' },
  containerTitle: { en: 'Magazine or tankoubon this chapter came from', zh: '這一章來自的雜誌或單行本', ja: 'この話の掲載誌・単行本' },
  editionsTitle: { en: 'This book in other languages and releases', zh: '同一本的其他語言／版本', ja: '同じ本の他言語版・別版' },
  series: { en: 'Series', zh: '系列', ja: 'シリーズ' },
  seriesTitle: { en: 'Other books of the same series', zh: '同系列的其他集', ja: '同シリーズの他の巻・話' },
  chapters: { en: 'Chapters', zh: '收錄作品', ja: '収録作品' },
  chaptersTitle: { en: 'Chapters cut from this magazine or tankoubon', zh: '從這本雜誌或單行本切出來的作品', ja: 'この掲載誌・単行本から切り出された作品' },
  requestsTitle: { en: 'URLs this script requested for this gallery', zh: '這個腳本為這本畫廊發出的請求', ja: 'このギャラリーのために送ったリクエスト' },
  searchRequests: { en: 'Search pages', zh: '搜尋頁', ja: '検索ページ' },
  metadataRequests: { en: 'Metadata API', zh: 'Metadata API', ja: 'メタデータ API' },
  galleriesUnit: { en: 'galleries', zh: '本', ja: '件' },
  noRequests: { en: 'Nothing was requested', zh: '一次請求都沒有發出', ja: 'リクエストは送っていません' },
  pages: { en: 'p', zh: '頁', ja: 'ページ' },
  torrent: { en: 'Torrents', zh: '種子', ja: 'トレント' },
  rewrite: { en: 'rewrite', zh: '重寫', ja: 'リライト' },
  roughTranslation: { en: 'rough translation', zh: '粗譯', ja: '粗訳' },
  settings: { en: 'Settings', zh: '設定', ja: '設定' },
  settingTitleLanguage: { en: 'Titles', zh: '標題顯示', ja: 'タイトル表示' },
  titleRomanized: { en: 'Romanized', zh: '英文／羅馬字', ja: 'ローマ字' },
  titleJapanese: { en: 'Japanese', zh: '日文', ja: '日本語' },
  settingSubtitle: { en: 'Show subtitle', zh: '顯示副標題', ja: '副題を表示' },
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
