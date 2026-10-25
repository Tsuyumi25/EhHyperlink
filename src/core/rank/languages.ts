import type { Locale } from '../locale'

export interface Language {
  /** ehwiki language tag name, e.g. `chinese` */
  value: string
  /** short visual identifier shown in language badges */
  code: string
  name: Record<Locale, string>
}

/** Languages with dedicated badge codes and display names; anything else falls back to `fallbackLanguage`. */
export const LANGUAGES: Language[] = [
  { value: 'chinese', code: '中', name: { en: 'Chinese', 'zh-TW': '中文', 'zh-CN': '中文', ja: '中国語', ko: '중국어' } },
  { value: 'japanese', code: 'あ', name: { en: 'Japanese', 'zh-TW': '日文', 'zh-CN': '日文', ja: '日本語', ko: '일본어' } },
  { value: 'english', code: 'EN', name: { en: 'English', 'zh-TW': '英文', 'zh-CN': '英文', ja: '英語', ko: '영어' } },
  { value: 'korean', code: '한', name: { en: 'Korean', 'zh-TW': '韓文', 'zh-CN': '韩文', ja: '韓国語', ko: '한국어' } },
  { value: 'spanish', code: 'ES', name: { en: 'Spanish', 'zh-TW': '西班牙文', 'zh-CN': '西班牙文', ja: 'スペイン語', ko: '스페인어' } },
  { value: 'russian', code: 'RU', name: { en: 'Russian', 'zh-TW': '俄文', 'zh-CN': '俄文', ja: 'ロシア語', ko: '러시아어' } },
  { value: 'french', code: 'FR', name: { en: 'French', 'zh-TW': '法文', 'zh-CN': '法文', ja: 'フランス語', ko: '프랑스어' } },
  { value: 'german', code: 'DE', name: { en: 'German', 'zh-TW': '德文', 'zh-CN': '德文', ja: 'ドイツ語', ko: '독일어' } },
  { value: 'italian', code: 'IT', name: { en: 'Italian', 'zh-TW': '義大利文', 'zh-CN': '意大利文', ja: 'イタリア語', ko: '이탈리아어' } },
  { value: 'portuguese', code: 'PT', name: { en: 'Portuguese', 'zh-TW': '葡萄牙文', 'zh-CN': '葡萄牙文', ja: 'ポルトガル語', ko: '포르투갈어' } },
  { value: 'thai', code: 'TH', name: { en: 'Thai', 'zh-TW': '泰文', 'zh-CN': '泰文', ja: 'タイ語', ko: '태국어' } },
  { value: 'vietnamese', code: 'VI', name: { en: 'Vietnamese', 'zh-TW': '越南文', 'zh-CN': '越南文', ja: 'ベトナム語', ko: '베트남어' } },
  { value: 'polish', code: 'PL', name: { en: 'Polish', 'zh-TW': '波蘭文', 'zh-CN': '波兰文', ja: 'ポーランド語', ko: '폴란드어' } },
  { value: 'hungarian', code: 'HU', name: { en: 'Hungarian', 'zh-TW': '匈牙利文', 'zh-CN': '匈牙利文', ja: 'ハンガリー語', ko: '헝가리어' } },
  { value: 'dutch', code: 'NL', name: { en: 'Dutch', 'zh-TW': '荷蘭文', 'zh-CN': '荷兰文', ja: 'オランダ語', ko: '네덜란드어' } },
  { value: 'indonesian', code: 'ID', name: { en: 'Indonesian', 'zh-TW': '印尼文', 'zh-CN': '印尼文', ja: 'インドネシア語', ko: '인도네시아어' } },
  { value: 'ukrainian', code: 'UK', name: { en: 'Ukrainian', 'zh-TW': '烏克蘭文', 'zh-CN': '乌克兰文', ja: 'ウクライナ語', ko: '우크라이나어' } },
  { value: 'turkish', code: 'TR', name: { en: 'Turkish', 'zh-TW': '土耳其文', 'zh-CN': '土耳其文', ja: 'トルコ語', ko: '튀르키예어' } },
  { value: 'arabic', code: 'AR', name: { en: 'Arabic', 'zh-TW': '阿拉伯文', 'zh-CN': '阿拉伯文', ja: 'アラビア語', ko: '아랍어' } },
  { value: 'czech', code: 'CS', name: { en: 'Czech', 'zh-TW': '捷克文', 'zh-CN': '捷克文', ja: 'チェコ語', ko: '체코어' } },
  { value: 'greek', code: 'EL', name: { en: 'Greek', 'zh-TW': '希臘文', 'zh-CN': '希腊文', ja: 'ギリシャ語', ko: '그리스어' } },
  { value: 'finnish', code: 'FI', name: { en: 'Finnish', 'zh-TW': '芬蘭文', 'zh-CN': '芬兰文', ja: 'フィンランド語', ko: '핀란드어' } },
  { value: 'swedish', code: 'SV', name: { en: 'Swedish', 'zh-TW': '瑞典文', 'zh-CN': '瑞典文', ja: 'スウェーデン語', ko: '스웨덴어' } },
  { value: 'norwegian', code: 'NO', name: { en: 'Norwegian', 'zh-TW': '挪威文', 'zh-CN': '挪威文', ja: 'ノルウェー語', ko: '노르웨이어' } },
  { value: 'danish', code: 'DA', name: { en: 'Danish', 'zh-TW': '丹麥文', 'zh-CN': '丹麦文', ja: 'デンマーク語', ko: '덴마크어' } },
  { value: 'romanian', code: 'RO', name: { en: 'Romanian', 'zh-TW': '羅馬尼亞文', 'zh-CN': '罗马尼亚文', ja: 'ルーマニア語', ko: '루마니아어' } },
  { value: 'hebrew', code: 'HE', name: { en: 'Hebrew', 'zh-TW': '希伯來文', 'zh-CN': '希伯来文', ja: 'ヘブライ語', ko: '히브리어' } },
  { value: 'hindi', code: 'HI', name: { en: 'Hindi', 'zh-TW': '印地文', 'zh-CN': '印地文', ja: 'ヒンディー語', ko: '힌디어' } },
  { value: 'tagalog', code: 'TL', name: { en: 'Tagalog', 'zh-TW': '他加祿文', 'zh-CN': '他加禄文', ja: 'タガログ語', ko: '타갈로그어' } },
  { value: 'mongolian', code: 'MN', name: { en: 'Mongolian', 'zh-TW': '蒙古文', 'zh-CN': '蒙古文', ja: 'モンゴル語', ko: '몽골어' } },
  { value: 'esperanto', code: 'EO', name: { en: 'Esperanto', 'zh-TW': '世界語', 'zh-CN': '世界语', ja: 'エスペラント', ko: '에스페란토' } },
  { value: 'speechless', code: '…', name: { en: 'Speechless', 'zh-TW': '無言', 'zh-CN': '无言', ja: '無言', ko: '대사 없음' } },
  { value: 'text cleaned', code: '□', name: { en: 'Text cleaned', 'zh-TW': '文字清除', 'zh-CN': '文字清除', ja: '文字消去', ko: '글자 지움' } },
  { value: 'rewrite', code: 'RW', name: { en: 'Rewrite', 'zh-TW': '重寫', 'zh-CN': '重写', ja: 'リライト', ko: '개작' } },
  { value: 'unknown', code: '?', name: { en: 'Unknown', 'zh-TW': '未知', 'zh-CN': '未知', ja: '不明', ko: '알 수 없음' } },
]

const BY_VALUE: Record<string, Language> = Object.fromEntries(LANGUAGES.map((language) => [language.value, language]))

export function languageOf(value: string): Language {
  return (
    BY_VALUE[value] ?? {
      value,
      code: value.slice(0, 3).toUpperCase(),
      name: { en: value, 'zh-TW': value, 'zh-CN': value, ja: value, ko: value },
    }
  )
}
