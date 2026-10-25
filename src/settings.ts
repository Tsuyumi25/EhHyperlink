import { reactive, watch } from 'vue'
import { storageGet, storageSet } from '@/services/gmStorage'
import { DEFAULT_MAX_REQUESTS } from '@/core/pipeline'
import type { LanguageScope } from '@/core/eh/ehSearch'

const STORAGE_KEY = 'ehl_settings_v1'

/** Rows that each carry their own title, or covers alone with one place for the hovered name. */
export const VIEWS = ['list', 'covers'] as const
export type View = (typeof VIEWS)[number]

export interface Settings {
  view: View
  /** searches one gallery page may send */
  maxRequests: number
  /** whether languages excluded in the account's EH settings still appear in the results */
  languages: LanguageScope
  /** trace every preview round trip into the debug log (src/services/debugLog.ts) */
  debug: boolean
}

const INITIAL: Settings = { view: 'list', maxRequests: DEFAULT_MAX_REQUESTS, languages: 'account', debug: false }

export const settings = reactive<Settings>({ ...INITIAL })

function isView(value: unknown): value is View {
  return typeof value === 'string' && (VIEWS as readonly string[]).includes(value)
}

function isLanguageScope(value: unknown): value is LanguageScope {
  return value === 'all' || value === 'account'
}

export function isMaxRequests(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1
}

export async function loadSettings(): Promise<void> {
  const raw = await storageGet(STORAGE_KEY)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        if ('view' in parsed && isView(parsed.view)) settings.view = parsed.view
        if ('maxRequests' in parsed && isMaxRequests(parsed.maxRequests)) settings.maxRequests = parsed.maxRequests
        if ('languages' in parsed && isLanguageScope(parsed.languages)) settings.languages = parsed.languages
        if ('debug' in parsed && typeof parsed.debug === 'boolean') settings.debug = parsed.debug
      }
    } catch {
      // unreadable payload: keep defaults, the next save overwrites it
    }
  }
  watch(settings, (current) => void storageSet(STORAGE_KEY, JSON.stringify(current)), { deep: true })
}
