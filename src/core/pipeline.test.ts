import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { findEditions, type JumpResult } from './pipeline'
import { fetchSearch, type SearchHit, type SearchResponse } from './eh/ehSearch'
import type * as SearchModule from './eh/ehSearch'
import { gallery } from './corpus/gallery'
import { hit } from './corpus/matching'

vi.mock('./eh/ehSearch', async (importOriginal) => ({
  ...(await importOriginal<typeof SearchModule>()),
  fetchSearch: vi.fn(),
}))
vi.mock('./eh/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  sweepCache: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./eh/throttle', () => ({
  metadataThrottle: { next: vi.fn().mockResolvedValue(undefined) },
}))

const origin = 'https://e-hentai.org'
const publication = hit({ gid: 21, title: 'COMIC Alphabeta Monthly Vol. 18' })
const japanesePublication = hit({ gid: 22, title: 'コミック甲 Vol.18' })
const englishEdition = hit({
  gid: 31,
  title: '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18) [English]',
})
const chineseEdition = hit({
  gid: 32,
  title: '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18) [Chinese]',
})
let metadataBatches: number[][]

function page(term: string, hits: SearchHit[]): SearchResponse {
  return {
    hits,
    at: 100,
    request: {
      kind: 'search',
      term,
      url: `${origin}/?f_search=${encodeURIComponent(term)}`,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchSearch).mockReset()
  metadataBatches = []
  const entries = new Map(
    [publication, japanesePublication, englishEdition, chineseEdition].map(
      (entry) => [entry.gid, entry],
    ),
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(String(options.body)) as {
        gidlist: [number, string][]
      }
      const gids = body.gidlist.map(([gid]) => gid)
      metadataBatches.push(gids)
      return new Response(
        JSON.stringify({ gmetadata: gids.map((gid) => entries.get(gid)) }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

// 原刊的兩個搜尋詞共用 metadata 批次；版本搜尋尚未完成時，原刊已可使用。
// 強制更新仍重用本輪取得的 metadata，重疊候選只向 API 取得一次。
it('publishes the complete container stage before editions and reuses its metadata', async () => {
  const source = gallery({
    title: '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18)',
    titleJpn: '[作者甲] 作品乙 (コミック甲 Vol.18)',
    category: 'Manga',
    tags: ['other:anthology'],
  })
  const remaining = Promise.withResolvers<SearchResponse>()
  const published = Promise.withResolvers<JumpResult>()
  vi.mocked(fetchSearch)
    .mockResolvedValueOnce(
      page('COMIC Alphabeta Monthly Vol. 18', [publication]),
    )
    .mockResolvedValueOnce(
      page('コミック甲 Vol.18', [japanesePublication, publication]),
    )
    .mockReturnValueOnce(remaining.promise)
    .mockResolvedValueOnce(page('作品乙', [chineseEdition]))
  const pending = findEditions(source, origin, ['english', 'chinese'], {
    force: true,
    onResult: published.resolve,
  })
  const early = await published.promise
  expect(early.containers.map((entry) => entry.gid)).toEqual([21, 22])
  expect(early.editions).toEqual([])
  expect(metadataBatches).toEqual([[21, 22]])
  expect(
    vi
      .mocked(fetchSearch)
      .mock.calls.slice(0, 2)
      .map((args) => args[1]),
  ).toEqual(['COMIC Alphabeta Monthly Vol. 18', 'コミック甲 Vol.18'])
  expect(early.requests.map((request) => request.kind)).toEqual([
    'search',
    'search',
    'metadata',
  ])

  remaining.resolve(page('Work Beta', [publication, englishEdition]))
  const final = await pending
  expect(
    final.editions.flatMap((group) =>
      group.books.flatMap((book) =>
        book.releases.map((edition) => edition.hit.gid),
      ),
    ),
  ).toEqual([31, 32])
  expect(final.containers.map((entry) => entry.gid)).toEqual([21, 22])
  expect(metadataBatches).toEqual([
    [21, 22],
    [31, 32],
  ])
  expect(final.requests.map((request) => request.kind)).toEqual([
    'search',
    'search',
    'metadata',
    'search',
    'search',
    'metadata',
  ])
  expect(final.metadataFromCache).toBe(0)
  expect(final.dataAt).toBe(100)
  expect(early.requests.map((request) => request.kind)).toEqual([
    'search',
    'search',
    'metadata',
  ])
})

// 後續搜尋失敗不會撤回已交付的原刊；呼叫端能保留結果並另行顯示失敗狀態。
it('leaves the published containers available when a later search fails', async () => {
  const source = gallery({
    title: '[Artist Alpha] Work Beta (COMIC Alphabeta Monthly Vol. 18)',
    category: 'Manga',
    tags: ['other:anthology'],
  })
  const published: JumpResult[] = []
  vi.mocked(fetchSearch)
    .mockResolvedValueOnce(
      page('COMIC Alphabeta Monthly Vol. 18', [publication]),
    )
    .mockRejectedValueOnce(new Error('search failed: HTTP 503'))
  await expect(
    findEditions(source, origin, [], {
      onResult: (result) => published.push(result),
    }),
  ).rejects.toThrow('search failed: HTTP 503')
  expect(
    published.map((result) => result.containers.map((entry) => entry.gid)),
  ).toEqual([[21]])
})

// 無原刊的路徑仍整批交付，不發布空的中間結果。
it('returns one completed result when no container search is planned', async () => {
  const onResult = vi.fn()
  vi.mocked(fetchSearch).mockResolvedValueOnce(
    page('Work Beta', [englishEdition]),
  )
  const result = await findEditions(gallery('Work Beta'), origin, ['english'], {
    onResult,
  })
  expect(
    result.editions.flatMap((group) =>
      group.books.flatMap((book) =>
        book.releases.map((edition) => edition.hit.gid),
      ),
    ),
  ).toEqual([31])
  expect(metadataBatches).toEqual([[31]])
  expect(onResult).not.toHaveBeenCalled()
})
