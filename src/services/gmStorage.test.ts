import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as StorageModule from './gmStorage'

// `hasGM` is decided when the module is evaluated, so each backend needs its own
// module instance; the `$` mock has to be in place before that import runs.
async function withBackend(GM: unknown): Promise<typeof StorageModule> {
  vi.resetModules()
  vi.doMock('$', () => ({ GM }))
  return await import('./gmStorage')
}

const rejecting = {
  getValue: () => Promise.reject(new Error('storage unavailable')),
  setValue: () => Promise.reject(new Error('storage unavailable')),
  listValues: () => Promise.reject(new Error('storage unavailable')),
  deleteValue: () => Promise.reject(new Error('storage unavailable')),
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.doUnmock('$')
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('storage that refuses to answer', () => {
  it('reads a GM rejection as nothing stored', async () => {
    const storage = await withBackend(rejecting)
    expect(await storage.storageGet('ehl_settings_v1')).toBeNull()
    expect(console.warn).toHaveBeenCalled()
  })

  it('keeps a GM write rejection away from the caller', async () => {
    const storage = await withBackend(rejecting)
    await expect(storage.storageSet('key', 'value')).resolves.toBeUndefined()
    await expect(storage.storageRemove('key')).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledTimes(2)
  })

  it('reads a failed listing as an empty store', async () => {
    const storage = await withBackend(rejecting)
    expect(await storage.storageKeys()).toEqual([])
  })

  it('reads a localStorage that denies access as nothing stored', async () => {
    const storage = await withBackend(undefined)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })
    expect(await storage.storageGet('key')).toBeNull()
    await expect(storage.storageSet('key', 'value')).resolves.toBeUndefined()
  })

  it('still stores and lists when the backend works', async () => {
    const storage = await withBackend(undefined)
    await storage.storageSet('ehl_cache_test', 'value')
    expect(await storage.storageGet('ehl_cache_test')).toBe('value')
    expect(await storage.storageKeys()).toContain('ehl_cache_test')
    await storage.storageRemove('ehl_cache_test')
    expect(await storage.storageGet('ehl_cache_test')).toBeNull()
  })
})
