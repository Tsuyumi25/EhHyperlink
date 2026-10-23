import { describe, expect, it } from 'vitest'
import { googleSearchOf, googleSearchUrl } from './google'
import { PREVIEW_TTL_MS, requestFor, requestOf, withRequestId } from './preview'

const NOW = 1_000_000
const key = (query: string, page = 0): string => googleSearchOf(new URL(googleSearchUrl(query, page)))?.key as string

describe('requestOf', () => {
  // Two gallery tabs preview the same search at once: both requests share a
  // key, and each background tab answers the one its fragment names, not
  // whichever came last.
  it('answers the request named in the fragment', () => {
    const first = { id: 'a', key: key('作品乙'), at: NOW - 1000 }
    const second = { id: 'b', key: key('作品乙'), at: NOW }
    const opened = new URL(withRequestId(googleSearchUrl('作品乙'), 'a'))
    expect(requestOf([first, second], opened, key('作品乙'), NOW)).toBe(first)
  })

  // The fragment rides along a redirect to a country domain; the query the
  // page shows is untouched by it.
  it('keeps the search and the id apart', () => {
    const opened = new URL(withRequestId(googleSearchUrl('作品乙', 1), 'a'))
    expect(googleSearchOf(opened)?.key).toBe(key('作品乙', 1))
    expect(opened.hash).toBe('#ehl-preview=a')
  })

  // A page that lost the fragment falls back to its search.
  it('falls back to the search when the fragment is gone', () => {
    const only = { id: 'a', key: key('作品乙'), at: NOW }
    expect(requestOf([only], new URL(googleSearchUrl('作品乙')), key('作品乙'), NOW)).toBe(only)
  })

  // A named request that expired is not answered, and another fresh request
  // for the same search does not stand in for it.
  it('answers nothing when the named request expired', () => {
    const stale = { id: 'a', key: key('作品乙'), at: NOW - PREVIEW_TTL_MS - 1 }
    const fresh = { id: 'b', key: key('作品乙'), at: NOW }
    const opened = new URL(withRequestId(googleSearchUrl('作品乙'), 'a'))
    expect(requestOf([stale, fresh], opened, key('作品乙'), NOW)).toBeNull()
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
