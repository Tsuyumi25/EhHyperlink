import { describe, expect, it } from 'vitest'
import { PREVIEW_TTL_MS, requestFor, searchKey, searchOf } from './preview'
import { googleSearchUrl } from './sites'

const NOW = 1_000_000
const key = (query: string, page = 0): string => searchKey(new URL(googleSearchUrl(query, page))) as string

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

describe('searchOf', () => {
  it('reads the search off a results page', () => {
    expect(searchOf(new URL(googleSearchUrl('作品乙', 2)))).toEqual({ key: key('作品乙', 2), blocked: false })
  })

  // The "unusual traffic" page keeps the original search in `continue`; the
  // request is still found, and answered as blocked.
  it('finds the search behind the unusual-traffic page', () => {
    const next = encodeURIComponent(googleSearchUrl('作品乙', 1))
    expect(searchOf(new URL(`https://www.google.com/sorry/index?continue=${next}&q=EgQ`))).toEqual({ key: key('作品乙', 1), blocked: true })
  })

  it('reads nothing off a page without a search', () => {
    expect(searchOf(new URL('https://www.google.com/search'))).toBeNull()
  })
})
