import { GM } from '$'

export const hasGM = typeof GM?.getValue === 'function'

const canList = hasGM && typeof GM.listValues === 'function'
const canDelete = hasGM && typeof GM.deleteValue === 'function'

/**
 * A storage backend that refuses to answer is a degraded cache, never a reason
 * to stop: a read that fails reads as nothing stored, a write that fails as a
 * value this page will have to fetch again.
 */
async function degrade<T>(operation: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  } catch (error) {
    console.warn(`[EhHyperlink] storage ${operation} failed`, error)
    return fallback
  }
}

export async function storageGet(key: string): Promise<string | null> {
  return degrade(
    'read',
    async () => {
      if (hasGM) return (await GM.getValue<string>(key, '')) || null
      return localStorage.getItem(key)
    },
    null,
  )
}

export async function storageSet(key: string, value: string): Promise<void> {
  await degrade(
    'write',
    async () => {
      if (hasGM) {
        await GM.setValue(key, value)
        return
      }
      localStorage.setItem(key, value)
    },
    undefined,
  )
}

export async function storageKeys(): Promise<string[]> {
  return degrade(
    'list',
    async () => {
      if (canList) return await GM.listValues()
      return Object.keys(localStorage)
    },
    [],
  )
}

export async function storageRemove(key: string): Promise<void> {
  await degrade(
    'delete',
    async () => {
      if (canDelete) {
        await GM.deleteValue(key)
        return
      }
      localStorage.removeItem(key)
    },
    undefined,
  )
}
