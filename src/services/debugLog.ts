import { storageGet, storageKeys, storageRemove, storageSet } from '@/services/gmStorage'

/**
 * A trace of the preview round trip, for when a search spins without an
 * answer. The background tab is closed and its console gone by the time
 * anyone looks, so both sides write here instead. One key per entry: tabs
 * write at once, and a shared list written read-modify-write keeps only the
 * last writer's entries. The entries can also be read in the userscript
 * manager's own value viewer, which does not depend on the change events the
 * round trip itself relies on.
 */
const LOG_PREFIX = 'ehl_log_'

export interface DebugEntry {
  at: number
  /** the host that wrote it: the gallery page or a site's tab */
  where: string
  /** the request it belongs to */
  id: string
  event: string
  detail: string
}

export async function debugLog(id: string, event: string, detail = ''): Promise<void> {
  const at = Date.now()
  const entry: DebugEntry = { at, where: location.hostname, id, event, detail }
  await storageSet(`${LOG_PREFIX}${at}_${Math.random().toString(36).slice(2, 8)}`, JSON.stringify(entry))
}

function parseEntry(raw: string | null): DebugEntry | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as DebugEntry
  } catch {
    return null
  }
}

async function logKeys(): Promise<string[]> {
  return (await storageKeys()).filter((key) => key.startsWith(LOG_PREFIX))
}

/** Every entry, oldest first. */
export async function readDebugLog(): Promise<DebugEntry[]> {
  const entries = await Promise.all((await logKeys()).map(async (key) => parseEntry(await storageGet(key))))
  return entries.filter((entry): entry is DebugEntry => entry !== null).sort((a, b) => a.at - b.at)
}

export async function clearDebugLog(): Promise<void> {
  await Promise.all((await logKeys()).map((key) => storageRemove(key)))
}

/** An error as one line: its message, or whatever was thrown. */
export function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}
