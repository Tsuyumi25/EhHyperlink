import { shallowRef } from 'vue'
import type { Locale } from '@/core/locale'
import { convertChain, parseOpenccDictionary, type OpenccDictionary } from '@/core/tags/opencc'
import { readTagNames, type TagNames } from '@/core/tags/tagNames'
import { storageGet, storageSet } from '@/services/gmStorage'

/**
 * Chinese tag names for the cover preview, from EhTagTranslation's database
 * (the one EhSyringe reads), and for a Traditional interface OpenCC's own
 * dictionaries; both fetched when first needed instead of bundled, and kept
 * for `KEEP_MS`. jsDelivr answers both with `Access-Control-Allow-Origin: *`
 * (checked 2026-10), so a plain fetch reaches them without `@connect`.
 */
const TAG_DB_URL = 'https://cdn.jsdelivr.net/gh/EhTagTranslation/DatabaseReleases@master/db.text.json'
/** Pinned: the dictionary format is OpenCC's, and a release keeps it fixed. */
const OPENCC_BASE = 'https://cdn.jsdelivr.net/gh/BYVoid/OpenCC@ver.1.4.2/data/dictionary/'
/** OpenCC's Simplified → Taiwan chain without the 1 MB `STPhrases` (see core/tags/opencc.ts). */
const TAIWAN_CHAIN = ['STCharacters.txt', 'TWPhrases.txt', 'TWVariants.txt']

const KEEP_MS = 7 * 24 * 60 * 60 * 1000
const NAMES_KEY = 'ehl_tag_names_v1'
const OPENCC_KEY = 'ehl_opencc_tw_v1'

interface Stored<T> {
  at: number
  data: T
}

/** A stored value younger than `KEEP_MS`, or what `fetchFresh` brings back (then stored). Null when neither is there. */
async function kept<T>(key: string, fetchFresh: () => Promise<T | null>): Promise<T | null> {
  const raw = await storageGet(key)
  if (raw) {
    try {
      const stored = JSON.parse(raw) as Stored<T>
      if (Date.now() - stored.at < KEEP_MS) return stored.data
    } catch {
      // unreadable: fetch again and overwrite it
    }
  }
  const data = await fetchFresh()
  if (data !== null) await storageSet(key, JSON.stringify({ at: Date.now(), data } satisfies Stored<T>))
  return data
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    return response.ok ? await response.text() : null
  } catch {
    return null
  }
}

async function fetchTagNames(): Promise<TagNames | null> {
  const text = await fetchText(TAG_DB_URL)
  if (text === null) return null
  try {
    return readTagNames(JSON.parse(text))
  } catch {
    return null
  }
}

async function fetchTaiwanChain(): Promise<string[] | null> {
  const texts = await Promise.all(TAIWAN_CHAIN.map((file) => fetchText(`${OPENCC_BASE}${file}`)))
  return texts.every((text): text is string => text !== null) ? texts : null
}

const names = shallowRef<TagNames | null>(null)
const taiwan = shallowRef<OpenccDictionary[] | null>(null)
let namesLoading: Promise<void> | null = null
let taiwanLoading: Promise<void> | null = null

function isChinese(locale: Locale): boolean {
  return locale === 'zh-TW' || locale === 'zh-CN'
}

/** Load what `locale` shows tags with; nothing for a locale that shows them as they are. */
export async function prepareTagNames(locale: Locale): Promise<void> {
  if (!isChinese(locale)) return
  namesLoading ??= kept(NAMES_KEY, fetchTagNames).then((loaded) => {
    names.value = loaded
  })
  if (locale === 'zh-TW') {
    taiwanLoading ??= kept(OPENCC_KEY, fetchTaiwanChain).then((texts) => {
      taiwan.value = texts?.map(parseOpenccDictionary) ?? null
    })
  }
  await Promise.all([namesLoading, taiwanLoading])
}

/**
 * How `locale` writes a name from the database: as it is in Simplified, through
 * the Taiwan chain in Traditional, and not at all elsewhere. Null when there is
 * no name to show — another locale, or the database or the dictionaries have
 * not arrived — so the caller keeps the tag as E-Hentai writes it.
 */
function localized(name: string | undefined, locale: Locale): string | null {
  if (name === undefined || !isChinese(locale)) return null
  if (locale === 'zh-CN') return name
  return taiwan.value ? convertChain(name, taiwan.value) : null
}

export function namespaceName(namespace: string, locale: Locale): string {
  return localized(names.value?.namespaces[namespace], locale) ?? namespace
}

export function tagName(namespace: string, tag: string, locale: Locale): string {
  return localized(names.value?.tags[`${namespace}:${tag}`], locale) ?? tag
}
