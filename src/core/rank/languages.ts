export interface Language {
  /** ehwiki language tag name, e.g. `chinese` */
  value: string
  /** short visual identifier shown in language badges */
  code: string
  name: { en: string; zh: string; ja: string }
}

/** Languages with dedicated badge codes and display names; anything else falls back to `fallbackLanguage`. */
export const LANGUAGES: Language[] = [
  { value: 'chinese', code: '中', name: { en: 'Chinese', zh: '中文', ja: '中国語' } },
  { value: 'japanese', code: 'あ', name: { en: 'Japanese', zh: '日文', ja: '日本語' } },
  { value: 'english', code: 'EN', name: { en: 'English', zh: '英文', ja: '英語' } },
  { value: 'korean', code: '한', name: { en: 'Korean', zh: '韓文', ja: '韓国語' } },
  { value: 'spanish', code: 'ES', name: { en: 'Spanish', zh: '西班牙文', ja: 'スペイン語' } },
  { value: 'russian', code: 'RU', name: { en: 'Russian', zh: '俄文', ja: 'ロシア語' } },
  { value: 'french', code: 'FR', name: { en: 'French', zh: '法文', ja: 'フランス語' } },
  { value: 'german', code: 'DE', name: { en: 'German', zh: '德文', ja: 'ドイツ語' } },
  { value: 'italian', code: 'IT', name: { en: 'Italian', zh: '義大利文', ja: 'イタリア語' } },
  { value: 'portuguese', code: 'PT', name: { en: 'Portuguese', zh: '葡萄牙文', ja: 'ポルトガル語' } },
  { value: 'thai', code: 'TH', name: { en: 'Thai', zh: '泰文', ja: 'タイ語' } },
  { value: 'vietnamese', code: 'VI', name: { en: 'Vietnamese', zh: '越南文', ja: 'ベトナム語' } },
  { value: 'polish', code: 'PL', name: { en: 'Polish', zh: '波蘭文', ja: 'ポーランド語' } },
  { value: 'hungarian', code: 'HU', name: { en: 'Hungarian', zh: '匈牙利文', ja: 'ハンガリー語' } },
  { value: 'dutch', code: 'NL', name: { en: 'Dutch', zh: '荷蘭文', ja: 'オランダ語' } },
  { value: 'indonesian', code: 'ID', name: { en: 'Indonesian', zh: '印尼文', ja: 'インドネシア語' } },
  { value: 'ukrainian', code: 'UK', name: { en: 'Ukrainian', zh: '烏克蘭文', ja: 'ウクライナ語' } },
  { value: 'turkish', code: 'TR', name: { en: 'Turkish', zh: '土耳其文', ja: 'トルコ語' } },
  { value: 'arabic', code: 'AR', name: { en: 'Arabic', zh: '阿拉伯文', ja: 'アラビア語' } },
  { value: 'czech', code: 'CS', name: { en: 'Czech', zh: '捷克文', ja: 'チェコ語' } },
  { value: 'greek', code: 'EL', name: { en: 'Greek', zh: '希臘文', ja: 'ギリシャ語' } },
  { value: 'finnish', code: 'FI', name: { en: 'Finnish', zh: '芬蘭文', ja: 'フィンランド語' } },
  { value: 'swedish', code: 'SV', name: { en: 'Swedish', zh: '瑞典文', ja: 'スウェーデン語' } },
  { value: 'norwegian', code: 'NO', name: { en: 'Norwegian', zh: '挪威文', ja: 'ノルウェー語' } },
  { value: 'danish', code: 'DA', name: { en: 'Danish', zh: '丹麥文', ja: 'デンマーク語' } },
  { value: 'romanian', code: 'RO', name: { en: 'Romanian', zh: '羅馬尼亞文', ja: 'ルーマニア語' } },
  { value: 'hebrew', code: 'HE', name: { en: 'Hebrew', zh: '希伯來文', ja: 'ヘブライ語' } },
  { value: 'hindi', code: 'HI', name: { en: 'Hindi', zh: '印地文', ja: 'ヒンディー語' } },
  { value: 'tagalog', code: 'TL', name: { en: 'Tagalog', zh: '他加祿文', ja: 'タガログ語' } },
  { value: 'mongolian', code: 'MN', name: { en: 'Mongolian', zh: '蒙古文', ja: 'モンゴル語' } },
  { value: 'esperanto', code: 'EO', name: { en: 'Esperanto', zh: '世界語', ja: 'エスペラント' } },
  { value: 'speechless', code: '…', name: { en: 'Speechless', zh: '無言', ja: '無言' } },
  { value: 'text cleaned', code: '□', name: { en: 'Text cleaned', zh: '文字清除', ja: '文字消去' } },
  { value: 'rewrite', code: 'RW', name: { en: 'Rewrite', zh: '重寫', ja: 'リライト' } },
  { value: 'unknown', code: '?', name: { en: 'Unknown', zh: '未知', ja: '不明' } },
]

const BY_VALUE: Record<string, Language> = Object.fromEntries(LANGUAGES.map((language) => [language.value, language]))

export function languageOf(value: string): Language {
  return (
    BY_VALUE[value] ?? {
      value,
      code: value.slice(0, 3).toUpperCase(),
      name: { en: value, zh: value, ja: value },
    }
  )
}
