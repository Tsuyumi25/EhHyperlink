import { describe, expect, it } from 'vitest'
import { readCategory } from './category'
import { readSourceGallery } from './galleryPage'

function badge(html: string): Element {
  return new DOMParser().parseFromString(html, 'text/html').body.firstElementChild as Element
}

describe('category badge', () => {
  it('reads the navigation target even when the visible text was translated', () => {
    expect(readCategory(badge(`<div class="cs ct3" onclick="document.location='https://e-hentai.org/manga'">漫画</div>`))).toBe('Manga')
    expect(readCategory(badge(`<div class="cn ct4" onclick="document.location='https://exhentai.org/artistcg'">Artist CG</div>`))).toBe('Artist CG')
    expect(readCategory(badge(`<div class="cn ct9" onclick="document.location='https://e-hentai.org/non-h'">Non-H</div>`))).toBe('Non-H')
  })

  it('falls back to the ct class, then to the text', () => {
    expect(readCategory(badge(`<div class="cs ct2">同人誌</div>`))).toBe('Doujinshi')
    expect(readCategory(badge(`<div class="cs">Cosplay</div>`))).toBe('Cosplay')
    expect(readCategory(null)).toBe('')
  })

  it('reaches the gallery reader', () => {
    const page = new DOMParser().parseFromString(
      `<h1 id="gn">Work Beta</h1><div id="gdc"><div class="cs ct3" onclick="document.location='https://e-hentai.org/manga'">マンガ</div></div>`,
      'text/html',
    )
    expect(readSourceGallery(page, '/g/1000/0a0a0a0a0a/')?.category).toBe('Manga')
  })
})
