import { describe, expect, it } from 'vitest'
import { PREVIEW_TTL_MS, queryOf, requestFor } from './preview'

const NOW = 1_000_000

describe('requestFor', () => {
  // The reader may preview the same term twice; the newer request is the one
  // whose gallery page is still waiting.
  it('answers the newest fresh request for the query', () => {
    const older = { id: 'a', query: '"作品乙"', at: NOW - 5000 }
    const newer = { id: 'b', query: '"作品乙"', at: NOW - 1000 }
    const other = { id: 'c', query: '"Circle Alpha"', at: NOW }
    expect(requestFor([older, newer, other], '"作品乙"', NOW)).toBe(newer)
  })

  // A search the reader runs on their own, and a request whose gallery page
  // gave up long ago, are both left alone.
  it('answers nothing for an unrequested or expired query', () => {
    const stale = { id: 'a', query: '"作品乙"', at: NOW - PREVIEW_TTL_MS - 1 }
    expect(requestFor([stale], '"作品乙"', NOW)).toBeNull()
    expect(requestFor([stale], 'something else', NOW)).toBeNull()
  })
})

describe('queryOf', () => {
  it('reads q off a search page', () => {
    expect(queryOf(new URL('https://www.google.com/search?q=%22%E4%BD%9C%E5%93%81%E4%B9%99%22'))).toEqual({ query: '"作品乙"', blocked: false })
  })

  // The "unusual traffic" page keeps the original search in `continue`; the
  // request is still found, and answered as blocked.
  it('finds the search behind the unusual-traffic page', () => {
    const next = encodeURIComponent('https://www.google.com/search?q=%22%E4%BD%9C%E5%93%81%E4%B9%99%22')
    expect(queryOf(new URL(`https://www.google.com/sorry/index?continue=${next}&q=EgQ`))).toEqual({ query: '"作品乙"', blocked: true })
  })

  it('reads nothing off a page without a search', () => {
    expect(queryOf(new URL('https://www.google.com/search'))).toBeNull()
  })
})
