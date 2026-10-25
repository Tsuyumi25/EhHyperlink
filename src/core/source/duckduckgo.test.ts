import { describe, expect, it } from 'vitest'
import { duckDuckGoNextForm, duckDuckGoPageOf, duckDuckGoPageUrl, duckDuckGoSearchOf, duckDuckGoSearchUrl, isDuckDuckGoResultPage, readDuckDuckGoResults } from './duckduckgo'

function page(html: string): Document {
  return new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html')
}

const result = (target: string, title: string): string => {
  const link = `//duckduckgo.com/l/?uddg=${encodeURIComponent(target)}&amp;rut=abc`
  return `<div class="result results_links results_links_deep web-result"><div class="links_main result__body">
    <h2 class="result__title"><a rel="nofollow" class="result__a" href="${link}">${title}</a></h2>
    <div class="result__extras"><div class="result__extras__url"><span class="result__icon"><a href="${link}"><img class="result__icon__img" src="//external-content.duckduckgo.com/ip3/store.example.ico"></a></span>
    <a class="result__url" href="${link}"> store.example/work/1 </a></div></div>
    <a class="result__snippet" href="${link}">作品乙の販売ページ。</a></div></div>`
}

const NEXT = '<form action="/html/" method="post"><input type="submit" class="btn btn--alt" value="Next"><input type="hidden" name="q" value="作品乙"><input type="hidden" name="vqd" value="4-1"></form>'

describe('readDuckDuckGoResults', () => {
  // The link goes through DuckDuckGo's redirect; the target is in `uddg` and
  // is what the reader copies and opens.
  it('reads each result with its own address, icon and snippet', () => {
    expect(readDuckDuckGoResults(page(`<div class="results">${result('https://store.example/work/1', '作品乙 - Store')}</div>`))).toEqual([
      {
        title: '作品乙 - Store',
        href: 'https://store.example/work/1',
        origin: 'https://store.example',
        icon: 'https://external-content.duckduckgo.com/ip3/store.example.ico',
        byline: 'store.example/work/1',
        snippet: '作品乙の販売ページ。',
        thumb: null,
        works: [],
      },
    ])
  })

  // "No results found" is drawn as a result block of its own; it is a result
  // page with nothing on it, not a page that failed to load.
  it('reads the no-results box as an empty result page', () => {
    const none = page('<div class="results"><div class="result results_links web-result result--no-result"><span class="no-results">No results found</span></div></div>')
    expect(readDuckDuckGoResults(none)).toEqual([])
    expect(isDuckDuckGoResultPage(none)).toBe(true)
    expect(isDuckDuckGoResultPage(page('<p>bot check</p>'))).toBe(false)
  })

  it('finds the Next form only where another page follows', () => {
    expect(duckDuckGoNextForm(page(`<div class="results"></div>${NEXT}`))).not.toBeNull()
    expect(duckDuckGoNextForm(page('<div class="results"></div>'))).toBeNull()
  })
})

describe('duckDuckGoSearchOf / duckDuckGoPageUrl', () => {
  // Safe search is off, or most of what a gallery title finds is hidden.
  it('searches with safe search off', () => {
    expect(new URL(duckDuckGoSearchUrl('作品乙')).searchParams.get('kp')).toBe('-2')
  })

  // A later page has no URL at DuckDuckGo; the page number rides along for
  // the tab, and tells the requests for two pages apart.
  it('marks which page a tab is to read', () => {
    const first = duckDuckGoSearchUrl('作品乙')
    const second = duckDuckGoPageUrl(first, 1)
    expect(duckDuckGoPageOf(new URL(second))).toBe(1)
    expect(duckDuckGoPageUrl(second, 0)).toBe(first)
    expect(duckDuckGoSearchOf(new URL(first))?.key).not.toBe(duckDuckGoSearchOf(new URL(second))?.key)
  })
})
