export const LOCALES = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko'] as const
export type Locale = (typeof LOCALES)[number]

/** A language the reader picked, or `auto` to follow the browser's preference. */
export type LocaleChoice = Locale | 'auto'

export function isLocaleChoice(value: unknown): value is LocaleChoice {
  return value === 'auto' || (LOCALES as readonly unknown[]).includes(value)
}

const TRADITIONAL_REGIONS = ['tw', 'hk', 'mo']

/**
 * The first supported language in the browser's preference order. Chinese
 * goes by its script when the tag names one (`zh-Hant-CN` reads Traditional),
 * by its region otherwise, and to Simplified when it names neither.
 */
export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const parts = language.toLowerCase().split('-')
    const primary = parts[0]
    if (primary === 'zh') {
      if (parts.includes('hans')) return 'zh-CN'
      if (parts.includes('hant')) return 'zh-TW'
      return parts.some((part) => TRADITIONAL_REGIONS.includes(part)) ? 'zh-TW' : 'zh-CN'
    }
    if (primary === 'en') return 'en'
    if (primary === 'ja') return 'ja'
    if (primary === 'ko') return 'ko'
  }
  return 'en'
}

export function resolveLocale(choice: LocaleChoice, languages: readonly string[]): Locale {
  return choice === 'auto' ? detectLocale(languages) : choice
}
