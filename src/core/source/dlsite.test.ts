import { describe, expect, it } from 'vitest'
import { dlsiteHasNextPage, dlsitePageUrl, dlsiteResultState, dlsiteSearchOf, dlsiteThumb, readDlsiteResults } from './dlsite'

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
        icon: null,
        byline: 'サークル甲 / 作家乙、作家丙',
        snippet: 'ボイス・ASMR · 1,100円 · RJ01000001',
        thumb: 'https://img.dlsite.jp/resize/images2/work/doujin/RJ01001000/RJ01000001_img_main_240x240.jpg',
        works: [],
      },
      {
        title: 'Work Beta',
        href: 'https://www.dlsite.com/maniax/work/=/product_id/RJ01000002.html',
        origin: 'https://www.dlsite.com',
        icon: null,
        byline: 'Circle Alpha',
        snippet: 'ボイス・ASMR · 1,100円 · RJ01000002',
        thumb: 'https://img.dlsite.jp/resize/images2/work/doujin/RJ01001000/RJ01000002_img_main_240x240.jpg',
        works: [],
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

  // A page past the last one is DLsite's 404 page, not a search that is
  // still rendering; waiting it out would only spin.
  it('reads the 404 page as missing', () => {
    expect(dlsiteResultState(page('<div class="error_box"><p class="title_text">ページが見つかりませんでした</p></div>'))).toBe('missing')
  })
})

describe('dlsiteHasNextPage', () => {
  const pager = (items: string): Document => page(`<table class="global_pagination"><tr><td class="page_no">${items}</td></tr></table>`)

  it('sees a page after the current one', () => {
    expect(dlsiteHasNextPage(pager('<ul><li><a href="#">1</a></li><li><strong>2</strong></li><li><a href="#">3</a></li></ul>'))).toBe(true)
  })

  // One page of results leaves the pager empty; the last page has nothing after its number.
  it('sees no page after a single page or the last one', () => {
    expect(dlsiteHasNextPage(pager(' '))).toBe(false)
    expect(dlsiteHasNextPage(pager('<ul><li><a href="#">1</a></li><li><strong>2</strong></li></ul>'))).toBe(false)
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

describe('dlsiteThumb', () => {
  // The folder is the id rounded up to the next thousand, keeping the id's
  // width; an id already on a thousand is its own folder.
  it('files a doujin cover under the id rounded up to a thousand', () => {
    expect(dlsiteThumb('RJ01000001')).toBe('https://img.dlsite.jp/resize/images2/work/doujin/RJ01001000/RJ01000001_img_main_240x240.jpg')
    expect(dlsiteThumb('RJ286001')).toBe('https://img.dlsite.jp/resize/images2/work/doujin/RJ287000/RJ286001_img_main_240x240.jpg')
    expect(dlsiteThumb('RJ01729000')).toBe('https://img.dlsite.jp/resize/images2/work/doujin/RJ01729000/RJ01729000_img_main_240x240.jpg')
  })

  // Books (single chapters, volumes) keep theirs under `books` the same way;
  // a prefix without a known image folder gets none.
  it('files a book cover under books and knows no other floor', () => {
    expect(dlsiteThumb('BJ01000001')).toBe('https://img.dlsite.jp/resize/images2/work/books/BJ01001000/BJ01000001_img_main_240x240.jpg')
    expect(dlsiteThumb('VJ01000001')).toBeNull()
  })
})

describe('readDlsiteResults covers', () => {
  const item = (thumb: string): Document =>
    page(`<li data-list_item_product_id="BJ01000001"><dl><dt class="search_img work_thumb"><div class="work_thumb_inner"><picture><img src="${thumb}"></picture></div></dt>
      <dd class="work_name"><a href="https://www.dlsite.com/books/work/=/product_id/BJ01000001.html" title="作品乙">作品乙</a></dd>
      <dd class="maker_name"><span class="author omit"><a href="#">作家乙</a></span></dd></dl></li>`)

  // Once the reader has confirmed their age the list shows the real cover,
  // protocol-relative; that is what the card shows. A book chapter names an
  // author and no circle.
  it('takes the cover the page shows', () => {
    const [result] = readDlsiteResults(item('//img.dlsite.jp/resize/images2/work/books/BJ01001000/BJ01000001_img_main_240x240.webp'))
    expect(result.thumb).toBe('https://img.dlsite.jp/resize/images2/work/books/BJ01001000/BJ01000001_img_main_240x240.webp')
    expect(result.byline).toBe('作家乙')
  })

  // Before that, the page shows a caution placeholder from its own host,
  // which is not the cover; the id stands in.
  it('falls back to the id when the page shows a placeholder', () => {
    const [result] = readDlsiteResults(item('/modpub/images/web/home/caution_img_sam.gif'))
    expect(result.thumb).toBe('https://img.dlsite.jp/resize/images2/work/books/BJ01001000/BJ01000001_img_main_240x240.jpg')
  })
})
