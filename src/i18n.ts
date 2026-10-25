import { readonly, ref } from 'vue'
import en from '@/locales/en'
import ja from '@/locales/ja'
import ko from '@/locales/ko'
import zhCN from '@/locales/zh-CN'
import zhTW from '@/locales/zh-TW'
import { detectLocale, type Locale } from '@/core/locale'

export type MessageKey = keyof typeof en

/** Every locale carries every key: a missing one fails the type check instead of showing blank at runtime. */
const MESSAGES = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  ja,
  ko,
} satisfies Record<Locale, Record<MessageKey, string>>

const current = ref<Locale>(detectLocale(navigator.languages))
export const locale = readonly(current)

export function setLocale(next: Locale): void {
  current.value = next
}

export function t(key: MessageKey): string {
  return MESSAGES[current.value][key]
}

/** Language priority follows the UI locale: the reader's own language first. */
export const LANGUAGE_PRIORITY: Record<Locale, readonly string[]> = {
  'zh-TW': ['chinese', 'japanese', 'english'],
  'zh-CN': ['chinese', 'japanese', 'english'],
  ja: ['japanese', 'english', 'chinese'],
  en: ['english', 'japanese', 'chinese'],
  ko: ['korean', 'japanese', 'english'],
}
