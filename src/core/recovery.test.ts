import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { SourceGallery } from './eh/galleryPage'

vi.mock('$', () => ({ GM: undefined }))
vi.mock('./eh/throttle', () => ({
  searchThrottle: { next: async () => {} },
  metadataThrottle: { next: async () => {} },
}))

const compact = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'eh/__fixtures__/search-compact.html'), 'utf8')
const emptyPage = '<div id="toppane"><div id="searchbox"><input name="f_search"></div></div><div><p>No hits found</p></div>'
const origin = 'https://e-hentai.org'
const source: SourceGallery = { gid: 9000, title: '[Circle Alpha] Work Gamma', titleJpn: '', category: 'Cosplay', tags: ['cosplayer:cosplayer_alpha'] }

beforeEach(() => {
  // 動態載入讓每例取得獨立的快取索引與請求冷卻狀態；靜態 import 會沿用上一例。
  vi.resetModules()
  vi.useFakeTimers()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('does not cache an invalid search response and accepts the recovered result', async () => {
  const { fetchSearch } = await import('./eh/ehSearch')
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response('<p>Temporarily unavailable</p>'))
    .mockResolvedValueOnce(new Response(compact))
  vi.stubGlobal('fetch', fetcher)
  const failed = await fetchSearch(origin, 'Work Alpha')
  expect(failed.request.error?.kind).toBe('invalid-response')
  expect(failed.request.hitCount).toBeNull()
  const recovered = await fetchSearch(origin, 'Work Alpha')
  expect(recovered.hits.map((hit) => hit.gid)).toEqual([1001, 1002])
  const cached = await fetchSearch(origin, 'Work Alpha')
  expect(cached.hits.map((hit) => hit.gid)).toEqual([1001, 1002])
  expect(fetcher).toHaveBeenCalledTimes(2)
})

it('keeps a legitimate empty search in cache', async () => {
  const { fetchSearch } = await import('./eh/ehSearch')
  const fetcher = vi.fn(async () => new Response(emptyPage))
  vi.stubGlobal('fetch', fetcher)
  const first = await fetchSearch(origin, 'Work Beta')
  const cached = await fetchSearch(origin, 'Work Beta')
  expect(first.request.error).toBeUndefined()
  expect(cached.hits).toEqual([])
  expect(cached.request.cached).toBe(true)
  expect(fetcher).toHaveBeenCalledTimes(1)
})

it('recovers from an exhausted first search on a later manual run', async () => {
  const { findEditions } = await import('./pipeline')
  const fetcher = vi.fn(async () => new Response('Unavailable', { status: 503 }))
  vi.stubGlobal('fetch', fetcher)
  const pending = findEditions(source, origin, [])
  await vi.runAllTimersAsync()
  const failed = await pending
  expect(failed.status).toBe('failed')
  expect(failed.requests.map((entry) => entry.attempts)).toEqual([3])
  expect(fetcher).toHaveBeenCalledTimes(3)
  fetcher.mockImplementation(async () => new Response(emptyPage))
  const recovered = await findEditions(source, origin, [], { force: true })
  expect(recovered.status).toBe('complete')
  expect(recovered.requests.map((entry) => entry.attempts)).toEqual([1])
})

it('preserves search results and reports metadata retry exhaustion as partial', async () => {
  const { findEditions } = await import('./pipeline')
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    return init.method === 'POST' ? new Response('Unavailable', { status: 503 }) : new Response(compact)
  }))
  const pending = findEditions(source, origin, [])
  await vi.runAllTimersAsync()
  const result = await pending
  expect(result.status).toBe('partial')
  expect(result.related.flatMap((group) => group.books.flatMap((book) => book.releases.map((release) => release.hit.gid))).sort()).toEqual([1001, 1002])
  expect(result.requests.filter((entry) => entry.kind === 'metadata')).toMatchObject([{ attempts: 3, failedGalleries: 2, error: { status: 503 } }])
})

it('stops remaining queries when the host refuses the run', async () => {
  const { findEditions } = await import('./pipeline')
  const fetcher = vi.fn(async () => new Response('Forbidden', { status: 403 }))
  vi.stubGlobal('fetch', fetcher)
  const result = await findEditions({ ...source, tags: [...source.tags, 'cosplayer:cosplayer_beta'] }, origin, [])
  expect(result.status).toBe('failed')
  expect(result.requests).toHaveLength(1)
  expect(fetcher).toHaveBeenCalledTimes(1)
})

it('isolates malformed metadata and fetches only the missing entry after recovery', async () => {
  const { findEditions } = await import('./pipeline')
  let malformed = true
  const batches: number[][] = []
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    if (init.method !== 'POST') return new Response(compact)
    const refs = JSON.parse(String(init.body)).gidlist as [number, string][]
    batches.push(refs.map(([gid]) => gid))
    const badGid = malformed ? 1001 : null
    return new Response(JSON.stringify({ gmetadata: refs.map(([gid]) => ({ gid, title: 'Work Beta', tags: gid === badGid ? [17] : [] })) }))
  }))
  const first = await findEditions(source, origin, [])
  expect(first.status).toBe('partial')
  expect(first.requests.filter((entry) => entry.kind === 'metadata')).toMatchObject([{ failedGalleries: 1 }])
  malformed = false
  const second = await findEditions(source, origin, [])
  expect(second.status).toBe('complete')
  expect(batches).toEqual([[1001, 1002], [1001]])
})

it('treats a malformed cache payload as a miss and returns fresh results', async () => {
  const { cacheSet } = await import('./eh/cache')
  const { fetchSearch, searchUrl } = await import('./eh/ehSearch')
  await cacheSet(searchUrl(origin, 'Work Delta'), null)
  const fetcher = vi.fn(async () => new Response(compact))
  vi.stubGlobal('fetch', fetcher)
  const result = await fetchSearch(origin, 'Work Delta')
  expect(result.hits.map((hit) => hit.gid)).toEqual([1001, 1002])
  expect(fetcher).toHaveBeenCalledTimes(1)
})

it('retains a successful metadata batch and refetches only the failed batch', async () => {
  const { fetchGalleryMetadata } = await import('./eh/ehApi')
  const refs = Array.from({ length: 27 }, (_, index) => ({ gid: 1001 + index, token: 'alpha' }))
  let recovering = false
  const batches: number[][] = []
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const gids = (JSON.parse(String(init.body)).gidlist as [number, string][]).map(([gid]) => gid)
    batches.push(gids)
    if (!recovering) {
      if (gids[0] === 1026) return new Response('Unavailable', { status: 503 })
    }
    return new Response(JSON.stringify({ gmetadata: gids.map((gid) => ({ gid, title: 'Work Beta', tags: [] })) }))
  }))
  const pending = fetchGalleryMetadata(refs)
  await vi.runAllTimersAsync()
  const first = await pending
  expect([...first.metadata.keys()]).toEqual(refs.slice(0, 25).map((ref) => ref.gid))
  expect(first.requests).toMatchObject([{ attempts: 1, failedGalleries: 0 }, { attempts: 3, failedGalleries: 2 }])
  recovering = true
  batches.length = 0
  const second = await fetchGalleryMetadata(refs)
  expect(second.fromCache).toBe(25)
  expect([...second.metadata.keys()]).toEqual(refs.map((ref) => ref.gid))
  expect(batches).toEqual([[1026, 1027]])
})
