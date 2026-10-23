import { describe, expect, it } from 'vitest'
import { dlsitePageUrl, dlsiteResultState, dlsiteSearchOf, readDlsiteResults } from './dlsite'

const SEARCH = 'https://www.dlsite.com/maniax/fsr/=/keyword/%E4%BD%9C%E5%93%81%E4%B9%99/'

/**
 * One work as the rendered search list lays it out (observed 2026-10), with
 * the Vue thumbnail and sample-view widgets left out: they carry nothing the
 * preview reads.
 */
const work = (id: string, title: string, circle: string, authors: string[]): string => `
  <li data-list_item_product_id="${id}" class="search_result_img_box_inner">
    <dl class="work_img_main">
      <dd class="work_category_free_sample"><div class="work_category type_SOU"><a href="/maniax/fsr/=/work_type/SOU">ボイス・ASMR</a></div></dd>
      <dd class="work_name"><div class="multiline_truncate"><a href="https://www.dlsite.com/maniax/work/=/product_id/${id}.html" title="${title}">${title}</a></div></dd>
      <dd class="maker_name"><a href="/maniax/circle/profile/=/maker_id/RG00001.html">${circle}</a>${
        authors.length > 0 ? `<span class="separator">/</span><span class="author omit">${authors.map((author) => `<a href="#">${author}</a>`).join(' ')}</span>` : ''
      }</dd>
      <dd class="work_price_wrap"><span class="work_price"><span class="work_price_base">1,100</span><span class="work_price_suffix">円</span></span></dd>
    </dl>
  </li>`

const page = (body: string): Document => new DOMParser().parseFromString(`<div id="search_result_list">${body}</div>`, 'text/html')

describe('readDlsiteResults', () => {
  it('reads title, link, circle with authors, and type, price and id', () => {
    const doc = page(`<ul>${work('RJ01000001', '作品乙', 'サークル甲', ['作家乙', '作家丙'])}${work('RJ01000002', 'Work Beta', 'Circle Alpha', [])}</ul>`)
    expect(readDlsiteResults(doc)).toEqual([
      {
        title: '作品乙',
        href: 'https://www.dlsite.com/maniax/work/=/product_id/RJ01000001.html',
        origin: 'https://www.dlsite.com',
        byline: 'サークル甲 / 作家乙、作家丙',
        snippet: 'ボイス・ASMR · 1,100円 · RJ01000001',
      },
      {
        title: 'Work Beta',
        href: 'https://www.dlsite.com/maniax/work/=/product_id/RJ01000002.html',
        origin: 'https://www.dlsite.com',
        byline: 'Circle Alpha',
        snippet: 'ボイス・ASMR · 1,100円 · RJ01000002',
      },
    ])
  })
})

describe('dlsiteResultState', () => {
  // The server HTML has an empty list that Vue fills in; only the items or
  // the "no matching works" box say the search has finished rendering.
  it('waits until the list or the no-result box renders', () => {
    expect(dlsiteResultState(page(''))).toBeNull()
    expect(dlsiteResultState(page(work('RJ01000001', '作品乙', 'サークル甲', [])))).toBe('results')
    expect(dlsiteResultState(page('<div class="work_not_found"></div>'))).toBe('none')
  })
})

describe('dlsiteSearchOf / dlsitePageUrl', () => {
  // DLsite pages a search with a trailing `page/<n>/`; page 1 has none, and
  // the two pages of one search are two requests.
  it('pages through one search by its trailing page segment', () => {
    const second = dlsitePageUrl(SEARCH, 1)
    expect(second).toBe(`${SEARCH}page/2/`)
    expect(dlsitePageUrl(second, 0)).toBe(SEARCH)
    expect(dlsiteSearchOf(new URL(second))?.key).not.toBe(dlsiteSearchOf(new URL(SEARCH))?.key)
    expect(dlsiteSearchOf(new URL(dlsitePageUrl(second, 1)))?.key).toBe(dlsiteSearchOf(new URL(second))?.key)
  })

  // Only a floor search is a search; a work page on the same site is not.
  it('reads nothing off pages that are not a floor search', () => {
    expect(dlsiteSearchOf(new URL('https://www.dlsite.com/maniax/work/=/product_id/RJ01000001.html'))).toBeNull()
    expect(dlsiteSearchOf(new URL('https://www.example.com/maniax/fsr/=/keyword/x/'))).toBeNull()
  })
})
