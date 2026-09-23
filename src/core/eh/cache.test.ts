import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as CacheModule from './cache'

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = (): void => {}
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

/**
 * The GM store as the cache sees it through `gmStorage`: a failing backend
 * answers nothing rather than throwing, and a gated key lets a read return the
 * snapshot it took before another write landed.
 */
const backend = vi.hoisted(() => ({
  values: new Map<string, string>(),
  gates: new Map<string, { reached: { promise: Promise<void>; resolve: () => void }; open: { promise: Promise<void>; resolve: () => void } }>(),
  offline: { read: false, write: false, list: false },
  nextWrite: null as { reached: { promise: Promise<void>; resolve: () => void }; open: { promise: Promise<void>; resolve: () => void } } | null,
}))

vi.mock('@/services/gmStorage', () => ({
  hasGM: false,
  storageGet: async (key: string): Promise<string | null> => {
    const seen = backend.offline.read ? null : (backend.values.get(key) ?? null)
    const gate = backend.gates.get(key)
    if (gate) {
      gate.reached.resolve()
      await gate.open.promise
    }
    return seen
  },
  storageSet: async (key: string, value: string): Promise<void> => {
    const gate = backend.nextWrite
    backend.nextWrite = null
    if (gate) {
      gate.reached.resolve()
      await gate.open.promise
    }
    if (backend.offline.write) return
    backend.values.set(key, value)
  },
  storageKeys: async (): Promise<string[]> => {
    if (backend.offline.list) return []
    return [...backend.values.keys()]
  },
  storageRemove: async (key: string): Promise<void> => {
    backend.values.delete(key)
  },
}))

const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

// a cache whose key index is empty is a cache that has not been imported yet:
// the index is module state, so every test needs its own module instance
async function freshCache(): Promise<typeof CacheModule> {
  vi.resetModules()
  return await import('./cache')
}

beforeEach(() => {
  backend.values.clear()
  backend.gates.clear()
  backend.offline.read = false
  backend.offline.write = false
  backend.offline.list = false
  backend.nextWrite = null
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T00:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('response cache', () => {
  it('reads back a search that legitimately found nothing', async () => {
    const cache = await freshCache()
    await cache.cacheSet('https://e-hentai.org/?f_search=nothing', [])
    const cached = await cache.cacheGet('https://e-hentai.org/?f_search=nothing', isStrings)
    expect(cached).toEqual({ data: [], at: Date.now() })
  })

  it('reads a value another page instance stored', async () => {
    const writer = await freshCache()
    await writer.cacheSet('url', ['a'])
    const reader = await freshCache()
    expect(await reader.cacheGet('url', isStrings)).toMatchObject({ data: ['a'] })
  })

  it('treats a payload the caller does not recognise as a miss and drops it', async () => {
    const cache = await freshCache()
    await cache.cacheSet('url', null)
    expect(await cache.cacheGet('url', isStrings)).toBeNull()
    expect(backend.values.size).toBe(0)
    expect(await cache.cacheGet('url', isStrings)).toBeNull()
  })

  it('treats an unparseable record as a miss', async () => {
    const cache = await freshCache()
    await cache.cacheSet('url', ['a'])
    for (const key of backend.values.keys()) backend.values.set(key, '{"at":')
    expect(await cache.cacheGet('url', isStrings)).toBeNull()
    expect(backend.values.size).toBe(0)
  })

  it('ignores a record stamped in the future', async () => {
    const cache = await freshCache()
    await cache.cacheSet('url', ['a'])
    vi.setSystemTime(new Date('2026-09-21T00:00:00Z'))
    expect(await cache.cacheGet('url', isStrings)).toBeNull()
  })

  it('lets a forced refetch replace the entry it was meant to replace, down to the same millisecond', async () => {
    const cache = await freshCache()
    await cache.cacheSet('url', ['stale'])
    await cache.cacheSet('url', [])
    expect(await cache.cacheGet('url', isStrings)).toMatchObject({ data: [] })
    expect(backend.values.size).toBe(1)
  })

  it('keeps the latest write when an earlier same-millisecond write finishes last', async () => {
    const cache = await freshCache()
    const gate = { reached: deferred(), open: deferred() }
    backend.nextWrite = gate
    const earlier = cache.cacheSet('url', ['earlier'])
    await gate.reached.promise
    await cache.cacheSet('url', ['latest'])
    gate.open.resolve()
    await earlier
    expect(await cache.cacheGet('url', isStrings)).toMatchObject({ data: ['latest'] })
  })

  it('orders equal-time cross-tab revisions consistently before sweeping', async () => {
    const left = await freshCache()
    const right = await freshCache()
    await left.cacheGet('url', isStrings)
    await right.cacheGet('url', isStrings)
    await left.cacheSet('url', ['left'])
    await right.cacheSet('url', ['right'])
    const first = await freshCache()
    const selected = await first.cacheGet('url', isStrings)
    const reversed = [...backend.values].reverse()
    backend.values.clear()
    for (const [key, value] of reversed) backend.values.set(key, value)
    const second = await freshCache()
    expect(await second.cacheGet('url', isStrings)).toEqual(selected)
    await Promise.all([first.sweepCache(), second.sweepCache()])
    const after = await freshCache()
    expect(await after.cacheGet('url', isStrings)).toEqual(selected)
  })

  it('drops expired records across builds while preserving another active build', async () => {
    backend.values.set('ehl_cache_0badbuild123_url#1758499200000-aaaaaa', '{"at":1758499200000,"data":["old build"]}')
    const cache = await freshCache()
    await cache.cacheSet('url', ['a'])
    vi.setSystemTime(new Date('2026-09-23T06:00:00Z'))
    const active = `ehl_cache_otherbuild_url#${Date.now()}-bbbbbb`
    backend.values.set(active, JSON.stringify({ at: Date.now(), data: ['active'] }))
    const later = await freshCache()
    await later.sweepCache()
    expect([...backend.values.keys()]).toEqual([active])
  })

  it('cannot delete a fresh record from the snapshot a sweep took before it', async () => {
    const writer = await freshCache()
    await writer.cacheSet('url', ['stale'])
    const [stale] = [...backend.values.keys()]
    vi.setSystemTime(new Date('2026-09-23T06:00:00Z'))

    const cache = await freshCache()
    const gate = { reached: deferred(), open: deferred() }
    backend.gates.set(stale, gate)
    const sweep = cache.sweepCache()
    await gate.reached.promise

    backend.gates.delete(stale)
    await cache.cacheSet('url', ['fresh'])
    gate.open.resolve()
    await sweep

    expect(await cache.cacheGet('url', isStrings)).toMatchObject({ data: ['fresh'] })
    expect(backend.values.size).toBe(1)
  })

  it('keeps a stored record when the read fails, so a working read still finds it', async () => {
    const cache = await freshCache()
    await cache.cacheSet('url', ['a'])
    backend.offline.read = true
    expect(await cache.cacheGet('url', isStrings)).toBeNull()
    await cache.sweepCache()
    expect(backend.values.size).toBe(1)
    backend.offline.read = false
    expect(await cache.cacheGet('url', isStrings)).toMatchObject({ data: ['a'] })
  })

  it('degrades to a miss when the backend stores nothing at all', async () => {
    backend.offline.write = true
    backend.offline.list = true
    const cache = await freshCache()
    await expect(cache.cacheSet('url', ['a'])).resolves.toBeUndefined()
    await expect(cache.sweepCache()).resolves.toBeUndefined()
    expect(await cache.cacheGet('url', isStrings)).toBeNull()
  })

  it('skips a payload it cannot serialise instead of failing the caller', async () => {
    const cache = await freshCache()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    await expect(cache.cacheSet('url', cyclic)).resolves.toBeUndefined()
    expect(backend.values.size).toBe(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
