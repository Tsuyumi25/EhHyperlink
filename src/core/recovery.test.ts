import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { SourceGallery } from './eh/galleryPage'
import type { JumpResult } from './pipeline'

vi.mock('$', () => ({ GM: undefined }))
vi.mock('./eh/throttle', () => ({
  searchThrottle: { next: async () => {} },
}))

const extended = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'eh/__fixtures__/search-extended.html'), 'utf8')
const emptyPage = '<div id="toppane"><div id="searchbox"><input name="f_search"></div></div><div><p>No hits found</p></div>'
const origin = 'https://e-hentai.org'
const source: SourceGallery = { gid: 9000, title: '[Circle Alpha] Work Gamma', titleJpn: '', category: 'Cosplay', tags: ['cosplayer:cosplayer_alpha'] }
const twoTagSource: SourceGallery = { ...source, tags: [...source.tags, 'cosplayer:cosplayer_beta'] }

function asksFor(url: unknown, name: string): boolean {
  return decodeURIComponent(String(url)).includes(name)
}

function discoveredGids(result: JumpResult): number[] {
  return result.related.flatMap((group) => group.books.flatMap((book) => book.releases.map((release) => release.hit.gid))).sort()
}

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

it('reports a rowless search as zero hits and allows a forced refresh', async () => {
  const { fetchSearch } = await import('./eh/ehSearch')
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response('<p>Temporarily unavailable</p>'))
    .mockResolvedValueOnce(new Response(extended))
  vi.stubGlobal('fetch', fetcher)
  const empty = await fetchSearch(origin, 'Work Alpha')
  expect(empty.hits).toEqual([])
  expect(empty.request.error).toBeUndefined()
  expect(empty.request.hitCount).toBe(0)
  const cachedEmpty = await fetchSearch(origin, 'Work Alpha')
  expect(cachedEmpty.request.hitCount).toBe(0)
  expect(cachedEmpty.request.cached).toBe(true)
  const recovered = await fetchSearch(origin, 'Work Alpha', 'published', true)
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

// 搜尋頁本身就帶回分類所需的標題與標籤，整趟只剩一個請求。
it('classifies the galleries a single search page returned', async () => {
  const { findEditions } = await import('./pipeline')
  const fetcher = vi.fn(async () => new Response(extended))
  vi.stubGlobal('fetch', fetcher)
  const result = await findEditions(source, origin, ['chinese'])
  expect(result.status).toBe('complete')
  expect(result.related.map((group) => group.language.value)).toEqual(['chinese', 'spanish'])
  expect(discoveredGids(result)).toEqual([1001, 1002])
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

// 一次查詢耗盡重試不會丟掉另一次查詢的結果；重跑時只有失敗的那次重新送出。
it('keeps the answered query partial and resends only the exhausted one', async () => {
  const { findEditions } = await import('./pipeline')
  let refusing = true
  const fetcher = vi.fn(async (url: string) => {
    if (asksFor(url, 'cosplayer beta')) {
      if (refusing) return new Response('Unavailable', { status: 503 })
    }
    return new Response(extended)
  })
  vi.stubGlobal('fetch', fetcher)
  const pending = findEditions(twoTagSource, origin, [])
  await vi.runAllTimersAsync()
  const partial = await pending
  expect(partial.status).toBe('partial')
  expect(discoveredGids(partial)).toEqual([1001, 1002])
  expect(partial.requests.map((entry) => entry.attempts)).toEqual([1, 3])
  expect(partial.requests[1].error?.status).toBe(503)

  refusing = false
  fetcher.mockClear()
  const recovered = await findEditions(twoTagSource, origin, [])
  expect(recovered.status).toBe('complete')
  expect(recovered.requests.map((entry) => entry.cached)).toEqual([true, undefined])
  expect(discoveredGids(recovered)).toEqual([1001, 1002])
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(asksFor(fetcher.mock.calls[0][0], 'cosplayer beta')).toBe(true)
})

it('stops remaining queries when the host refuses the run', async () => {
  const { findEditions } = await import('./pipeline')
  const fetcher = vi.fn(async () => new Response('Forbidden', { status: 403 }))
  vi.stubGlobal('fetch', fetcher)
  const result = await findEditions(twoTagSource, origin, [])
  expect(result.status).toBe('failed')
  expect(result.requests).toHaveLength(1)
  expect(fetcher).toHaveBeenCalledTimes(1)
})

it('treats a malformed cache payload as a miss and returns fresh results', async () => {
  const { cacheSet } = await import('./eh/cache')
  const { fetchSearch, searchUrl } = await import('./eh/ehSearch')
  await cacheSet(searchUrl(origin, 'Work Delta'), null)
  const fetcher = vi.fn(async () => new Response(extended))
  vi.stubGlobal('fetch', fetcher)
  const result = await fetchSearch(origin, 'Work Delta')
  expect(result.hits.map((hit) => hit.gid)).toEqual([1001, 1002])
  expect(fetcher).toHaveBeenCalledTimes(1)
})
