import { storageGet, storageKeys, storageRemove, storageSet } from '@/services/gmStorage'

/**
 * One cache entry per request, written the moment that request returns.
 *
 * Per-request rather than per-gallery, which is what makes two things fall out
 * for free: a reload that interrupts a half-finished search resumes from the
 * responses already in here, and another gallery of the same series asks for the
 * same search URL and never sends it.
 *
 * The TTL is a day. Relatives of a gallery keep arriving for years — over 42,968
 * corpus groups with more than one release, the median gap from the first
 * release to a later one is 191 days, and only 4.8% arrive within a day of it —
 * so the daily rate of anything new appearing sits under 1%, and a day of
 * staleness costs almost nothing against a page reload that sends nothing.
 *
 * `__BUILD_HASH__` is in every key: a rule change has to show up on the next
 * page load, not a day later.
 */
const TTL_MS = 24 * 60 * 60 * 1000
const PREFIX = `ehl_cache_${__BUILD_HASH__}_`

interface Entry<T> {
  at: number
  data: T
}

function isEntry(value: unknown): value is Entry<unknown> {
  return typeof value === 'object' && value !== null && 'at' in value && typeof value.at === 'number' && 'data' in value
}

/** A cached response and when it was stored, or null when nothing usable is there. */
export interface Cached<T> {
  data: T
  at: number
}

export async function cacheGet<T>(key: string): Promise<Cached<T> | null> {
  const raw = await storageGet(PREFIX + key)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isEntry(parsed) || Date.now() - parsed.at > TTL_MS) return null
    return { data: parsed.data as T, at: parsed.at }
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  await storageSet(PREFIX + key, JSON.stringify({ at: Date.now(), data } satisfies Entry<T>))
}

/**
 * Entries an earlier build wrote can never be read again, and expired ones of
 * this build never will be either. One sweep per page, started but not waited
 * for: nothing downstream depends on it.
 */
export async function sweepCache(): Promise<void> {
  const keys = await storageKeys()
  for (const key of keys) {
    if (!key.startsWith('ehl_cache_')) continue
    if (!key.startsWith(PREFIX)) {
      await storageRemove(key)
      continue
    }
    const raw = await storageGet(key)
    if (!raw) continue
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!isEntry(parsed) || Date.now() - parsed.at > TTL_MS) await storageRemove(key)
    } catch {
      await storageRemove(key)
    }
  }
}
