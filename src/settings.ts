import { reactive, watch } from 'vue'
import { storageGet, storageSet } from '@/services/gmStorage'

const STORAGE_KEY = 'ehl_settings_v1'

/** Which title field to show for each listed gallery; a gallery with one field shows that one. */
export const TITLE_LANGUAGES = ['romanized', 'japanese'] as const
export type TitleLanguage = (typeof TITLE_LANGUAGES)[number]

/** Rows that each carry their own title, or covers alone with one place for the hovered name. */
export const VIEWS = ['list', 'covers'] as const
export type View = (typeof VIEWS)[number]

export interface Settings {
  titleLanguage: TitleLanguage
  /** show the other title field under the main one when a gallery has both */
  showSubtitle: boolean
  view: View
}

// Romanized reads as one line on every locale, and the second line is what tells
// two releases of one book apart when the work text is identical.
const INITIAL: Settings = { titleLanguage: 'romanized', showSubtitle: true, view: 'list' }

export const settings = reactive<Settings>({ ...INITIAL })

function isTitleLanguage(value: unknown): value is TitleLanguage {
  return typeof value === 'string' && (TITLE_LANGUAGES as readonly string[]).includes(value)
}

function isView(value: unknown): value is View {
  return typeof value === 'string' && (VIEWS as readonly string[]).includes(value)
}

export async function loadSettings(): Promise<void> {
  const raw = await storageGet(STORAGE_KEY)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        if ('titleLanguage' in parsed && isTitleLanguage(parsed.titleLanguage)) settings.titleLanguage = parsed.titleLanguage
        if ('showSubtitle' in parsed && typeof parsed.showSubtitle === 'boolean') settings.showSubtitle = parsed.showSubtitle
        if ('view' in parsed && isView(parsed.view)) settings.view = parsed.view
      }
    } catch {
      // unreadable payload: keep defaults, the next save overwrites it
    }
  }
  watch(settings, (current) => void storageSet(STORAGE_KEY, JSON.stringify(current)), { deep: true })
}

/** The title to show under the current setting, falling back to whichever field the gallery has. */
export function displayTitle(gallery: { title: string; titleJpn: string }): string {
  if (settings.titleLanguage === 'japanese') return gallery.titleJpn || gallery.title
  return gallery.title || gallery.titleJpn
}

/** The other title field as a second line, or empty when the setting is off or the gallery has only one field. */
export function subtitle(gallery: { title: string; titleJpn: string }): string {
  if (!settings.showSubtitle) return ''
  const main = displayTitle(gallery)
  const other = main === gallery.title ? gallery.titleJpn : gallery.title
  return other === main ? '' : other
}
