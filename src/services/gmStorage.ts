import { GM } from '$'

export const hasGM = typeof GM?.getValue === 'function'

export async function storageGet(key: string): Promise<string | null> {
  if (hasGM) return (await GM.getValue<string>(key, '')) || null
  return localStorage.getItem(key)
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (hasGM) {
    await GM.setValue(key, value)
    return
  }
  try {
    localStorage.setItem(key, value)
  } catch {
    // quota exceeded: settings are small, next save will retry
  }
}

export async function storageKeys(): Promise<string[]> {
  if (hasGM && typeof GM.listValues === 'function') return await GM.listValues()
  return Object.keys(localStorage)
}

export async function storageRemove(key: string): Promise<void> {
  if (hasGM && typeof GM.deleteValue === 'function') {
    await GM.deleteValue(key)
    return
  }
  localStorage.removeItem(key)
}
