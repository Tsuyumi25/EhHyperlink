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
const FAMILY = 'ehl_cache_'
const PREFIX = `${FAMILY}${__BUILD_HASH__}_`

/** Immutable physical keys let a stale sweep delete only the revision it inspected. */
const REVISION_MARK = '#'

interface Envelope {
  at: number
  data: unknown
}

interface Revision {
  key: string
  at: number
}

interface Store {
  revisions: Map<string, Revision[]>
  /** Active tabs may still use these builds; retain their unexpired records. */
  foreign: string[]
}

type Stored = { state: 'missing' } | { state: 'unusable' } | { state: 'usable'; at: number; data: unknown }

const MISSING: Stored = { state: 'missing' }
const UNUSABLE: Stored = { state: 'unusable' }

export interface Cached<T> {
  data: T
  at: number
}

let snapshot: Promise<Store> | null = null
let writeSequence = 0

// 同毫秒寫入依分頁內序號排序；跨分頁同序號以唯一 key 決定一致清理順序。

function newestFirst(left: Revision, right: Revision): number {
  if (left.at !== right.at) return right.at - left.at
  if (left.key === right.key) return 0
  return left.key > right.key ? -1 : 1
}

/**
 * One listing avoids rescanning storage for every metadata entry. Local writes
 * update it; later writes from other tabs become visible on the next page load.
 * Until then this page may reuse an older valid revision or fetch on a miss.
 */
function store(): Promise<Store> {
  snapshot ??= scan()
  return snapshot
}

async function scan(): Promise<Store> {
  const revisions = new Map<string, Revision[]>()
  const foreign: string[] = []
  for (const key of await storageKeys()) {
    if (!key.startsWith(FAMILY)) continue
    const parsed = readKey(key)
    if (!parsed) {
      foreign.push(key)
      continue
    }
    const known = revisions.get(parsed.logical)
    if (known) known.push({ key, at: parsed.at })
    else revisions.set(parsed.logical, [{ key, at: parsed.at }])
  }
  for (const list of revisions.values()) list.sort(newestFirst)
  return { revisions, foreign }
}

function readKey(key: string): { logical: string; at: number } | null {
  if (!key.startsWith(PREFIX)) return null
  const mark = key.lastIndexOf(REVISION_MARK)
  if (mark <= PREFIX.length) return null
  const at = Number.parseInt(key.slice(mark + REVISION_MARK.length), 10)
  if (!Number.isFinite(at)) return null
  return { logical: key.slice(PREFIX.length, mark), at }
}

function isEnvelope(value: unknown): value is Envelope {
  return typeof value === 'object' && value !== null && 'at' in value && typeof value.at === 'number' && Number.isFinite(value.at) && 'data' in value
}

function isFresh(at: number): boolean {
  const age = Date.now() - at
  return age >= 0 && age <= TTL_MS
}

async function readRevision(key: string): Promise<Stored> {
  const raw = await storageGet(key)
  if (!raw) return MISSING
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return UNUSABLE
  }
  if (!isEnvelope(parsed)) return UNUSABLE
  if (!isFresh(parsed.at)) return UNUSABLE
  return { state: 'usable', at: parsed.at, data: parsed.data }
}

async function discard(current: Store, logical: string, key: string): Promise<void> {
  await storageRemove(key)
  const alive = (current.revisions.get(logical) ?? []).filter((revision) => revision.key !== key)
  if (alive.length === 0) current.revisions.delete(logical)
  else current.revisions.set(logical, alive)
}

/** Invalid payloads become cache misses instead of breaking every subsequent load. */
export async function cacheGet<T>(key: string, validate: (value: unknown) => value is T): Promise<Cached<T> | null> {
  const current = await store()
  for (const revision of current.revisions.get(key) ?? []) {
    const record = await readRevision(revision.key)
    if (record.state === 'missing') continue
    if (record.state === 'usable') {
      const value: unknown = record.data
      if (validate(value)) return { data: value, at: record.at }
    }
    await discard(current, key, revision.key)
  }
  return null
}

/** Local write order survives asynchronous completion; other tabs share a stable tie-break. */
export async function cacheSet<T>(key: string, data: T): Promise<void> {
  const at = Date.now()
  const order = (++writeSequence).toString(36).padStart(11, '0')
  const physical = `${PREFIX}${key}${REVISION_MARK}${at}-${order}-${crypto.randomUUID()}`
  const current = await store()
  let payload: string
  try {
    payload = JSON.stringify({ at, data } satisfies Envelope)
  } catch (error) {
    console.warn('[EhHyperlink] cache write skipped', error)
    return
  }
  await storageSet(physical, payload)
  const previous = current.revisions.get(key) ?? []
  const next = { key: physical, at }
  const newer = previous.filter((revision) => newestFirst(revision, next) < 0)
  current.revisions.set(key, [...newer, next])
  for (const revision of previous) {
    if (newestFirst(revision, next) < 0) continue
    await discard(current, key, revision.key)
  }
}

/**
 * Other builds may still have open tabs. Remove their expired records only;
 * this build also prunes superseded revisions from its own snapshot.
 */
export async function sweepCache(): Promise<void> {
  const current = await store()
  for (const key of current.foreign.splice(0)) {
    const record = await readRevision(key)
    if (record.state === 'unusable') await storageRemove(key)
  }
  for (const [logical, revisions] of [...current.revisions]) {
    let kept = false
    for (const revision of revisions) {
      if (kept) {
        await discard(current, logical, revision.key)
        continue
      }
      const record = await readRevision(revision.key)
      if (record.state === 'usable') {
        kept = true
        continue
      }
      // a read that failed answers the same as an absent record, and a record
      // this page cannot read is not a record it may throw away
      if (record.state === 'unusable') await discard(current, logical, revision.key)
    }
  }
}
