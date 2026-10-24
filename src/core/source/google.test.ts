import { describe, expect, it } from 'vitest'
import { citeOrigin, googlePageUrl, googleSearchOf, googleSearchUrl, readGoogleResults } from './google'

/**
 * The shape observed on a live results page (2026-10), with generated class
 * names dropped: each organic result is a `div[data-hveid]` holding the title
 * link, the `<cite>` breadcrumb and the snippet; the link is an opaque `/goto`.
 */
function page(...blocks: string[]): Document {
  return new DOMParser().parseFromString(`<div id="search"><div id="rso">${blocks.join('')}</div></div>`, 'text/html')
}

const result = (title: string, cite: string, snippet: string, token: string): string => `
  <div data-hveid="x">
    <div><a href="https://www.google.com/goto?url=${token}"><h3>${title}</h3><div><span><img src="data:image/png;base64,${token}"></span><span>Site</span><cite>${cite}</cite></div></a></div>
    <div><span>${snippet}</span></div>
  </div>`

describe('readGoogleResults', () => {
  // The icon is the one Google drew inside the link; the byline is the site
  // name and breadcrumb as Google prints them, joined from separate elements.
  it('reads title, link, icon, site line and snippet of each result in order', () => {
    const doc = page(
      result('Circle Alpha - Creator Page', 'https://creator.example › creator', 'The creator page of Circle Alpha.', 'AAA'),
      result('作品乙 - Store', 'https://store.example › work › 1', '作品乙の販売ページ。', 'BBB'),
    )
    expect(readGoogleResults(doc)).toEqual([
      { title: 'Circle Alpha - Creator Page', href: 'https://www.google.com/goto?url=AAA', origin: 'https://creator.example', icon: 'data:image/png;base64,AAA', byline: 'Site https://creator.example › creator', snippet: 'The creator page of Circle Alpha.', thumb: null, works: [] },
      { title: '作品乙 - Store', href: 'https://www.google.com/goto?url=BBB', origin: 'https://store.example', icon: 'data:image/png;base64,BBB', byline: 'Site https://store.example › work › 1', snippet: '作品乙の販売ページ。', thumb: null, works: [] },
    ])
  })

  // Headings outside `#search` (the "People also ask" sidebar, the header)
  // are not results.
  it('ignores headings outside the results', () => {
    const doc = new DOMParser().parseFromString('<a href="/x"><h3>Elsewhere</h3></a><div id="search"></div>', 'text/html')
    expect(readGoogleResults(doc)).toEqual([])
  })
})

describe('citeOrigin', () => {
  // The breadcrumb is the only readable trace of the target, so its leading
  // URL is what the site icon comes from.
  it('takes the origin off the breadcrumb', () => {
    expect(citeOrigin('https://creator.example › creator › 1')).toBe('https://creator.example')
    expect(citeOrigin('Site name')).toBeNull()
  })
})

describe('googleSearchOf', () => {
  // A country domain Google redirects to is still Google; another site's
  // `/search` is not.
  it('reads a search on www.google.com and its country domains only', () => {
    const hk = new URL('https://www.google.com.hk/search?q=%E4%BD%9C%E5%93%81%E4%B9%99&sei=x')
    expect(googleSearchOf(hk)).toEqual(googleSearchOf(new URL(googleSearchUrl('作品乙'))))
    expect(googleSearchOf(new URL('https://www.pixiv.net/search?q=%E4%BD%9C%E5%93%81%E4%B9%99'))).toBeNull()
  })

  // The "unusual traffic" page keeps the original search in `continue`; the
  // request is still found, and answered as blocked.
  it('finds the search behind the unusual-traffic page', () => {
    const next = encodeURIComponent(googleSearchUrl('作品乙', 1))
    const sorry = googleSearchOf(new URL(`https://www.google.com/sorry/index?continue=${next}&q=EgQ`))
    expect(sorry).toEqual({ key: googleSearchOf(new URL(googleSearchUrl('作品乙', 1)))?.key, blocked: true })
  })

  // Two pages of one query are two searches.
  it('tells pages of one query apart', () => {
    const first = googleSearchOf(new URL(googleSearchUrl('作品乙')))?.key
    const second = googleSearchOf(new URL(googlePageUrl(googleSearchUrl('作品乙'), 1)))?.key
    expect(second).not.toBe(first)
    expect(new URL(googlePageUrl(googleSearchUrl('作品乙'), 1)).searchParams.get('start')).toBe('10')
  })
})
