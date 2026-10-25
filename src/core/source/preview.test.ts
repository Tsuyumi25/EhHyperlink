import { describe, expect, it } from 'vitest'
import { googleSearchOf, googleSearchUrl } from './google'
import { freshRequestIdOf, newRequestId, PREVIEW_TTL_MS, requestFor, withRequestId, withWebLinksOnly, type PreviewResult } from './preview'

const NOW = 1_000_000
const key = (query: string, page = 0): string => googleSearchOf(new URL(googleSearchUrl(query, page)))?.key as string

describe('freshRequestIdOf', () => {
  // A new tab may not see the request its opener just stored; the id in the
  // fragment is answered on its own, carrying its time for the freshness check.
  it('takes the id from the fragment while it is fresh', () => {
    const opened = new URL(withRequestId(googleSearchUrl('作品乙'), newRequestId(NOW - 1000, 'x')))
    expect(freshRequestIdOf(opened, NOW)).toBe(newRequestId(NOW - 1000, 'x'))
  })

  // A tab reopened from history long after keeps its fragment; nobody waits on it.
  it('drops an expired id', () => {
    const opened = new URL(withRequestId(googleSearchUrl('作品乙'), newRequestId(NOW - PREVIEW_TTL_MS - 1, 'x')))
    expect(freshRequestIdOf(opened, NOW)).toBeNull()
  })

  it('gives nothing for a page without a fragment', () => {
    expect(freshRequestIdOf(new URL(googleSearchUrl('作品乙')), NOW)).toBeNull()
  })

  // The fragment rides along a redirect to a country domain; the query the
  // page shows is untouched by it.
  it('keeps the search and the id apart', () => {
    const opened = new URL(withRequestId(googleSearchUrl('作品乙', 1), 'a'))
    expect(googleSearchOf(opened)?.key).toBe(key('作品乙', 1))
    expect(opened.hash).toBe('#ehl-preview=a')
  })
})

describe('requestFor', () => {
  // The reader may preview the same search twice; the newer request is the one
  // whose gallery page is still waiting.
  it('answers the newest fresh request for the search', () => {
    const older = { id: 'a', key: key('作品乙'), at: NOW - 5000 }
    const newer = { id: 'b', key: key('作品乙'), at: NOW - 1000 }
    const other = { id: 'c', key: key('Circle Alpha'), at: NOW }
    expect(requestFor([older, newer, other], key('作品乙'), NOW)).toBe(newer)
  })

  // Two pages of one query are two searches: page 2's tab must not answer
  // page 1's request.
  it('keeps pages of one query apart', () => {
    const first = { id: 'a', key: key('作品乙', 0), at: NOW }
    const second = { id: 'b', key: key('作品乙', 1), at: NOW }
    expect(requestFor([first, second], key('作品乙', 1), NOW)).toBe(second)
    expect(requestFor([first, second], key('作品乙', 0), NOW)).toBe(first)
  })

  // A search the reader runs on their own, and a request whose gallery page
  // gave up long ago, are both left alone.
  it('answers nothing for an unrequested or expired search', () => {
    const stale = { id: 'a', key: key('作品乙'), at: NOW - PREVIEW_TTL_MS - 1 }
    expect(requestFor([stale], key('作品乙'), NOW)).toBeNull()
    expect(requestFor([stale], key('something else'), NOW)).toBeNull()
  })
})

describe('withWebLinksOnly', () => {
  const result = (href: string, works: string[] = []): PreviewResult => ({
    title: '作品乙',
    href,
    origin: null,
    icon: null,
    byline: '',
    snippet: '',
    thumb: null,
    works: works.map((work) => ({ href: work, thumb: '', title: '' })),
  })

  // Links come from other sites' markup; only ones that open a web page reach the gallery page.
  it('drops results and works whose link is not http or https', () => {
    const answer = withWebLinksOnly({
      status: 'ok',
      results: [result('https://store.example/1', ['javascript:alert(1)', 'https://store.example/2']), result('javascript:alert(1)'), result('not a url')],
    })
    expect(answer.results.map((kept) => kept.href)).toEqual(['https://store.example/1'])
    expect(answer.results[0].works.map((work) => work.href)).toEqual(['https://store.example/2'])
  })
})
