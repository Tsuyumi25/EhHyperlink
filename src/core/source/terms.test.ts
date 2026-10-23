import { describe, expect, it } from 'vitest'
import type { SourceGallery } from '../eh/galleryPage'
import { googleQuery, searchTerms } from './terms'

function gallery(title: string, titleJpn: string, tags: string[] = []): SourceGallery {
  return { gid: 1, title, titleJpn, category: 'Doujinshi', tags }
}

describe('searchTerms', () => {
  // The stores index the original title, so the Japanese field is read when
  // present; the convention and language markers are claimed by the marker
  // table and never become terms. `Circle (Artist)` splits into both roles.
  it('reads work, circle and artist from the Japanese title', () => {
    expect(searchTerms(gallery('(C104) [Circle Alpha (Artist Beta)] Work Beta [Chinese]', '(C104) [サークル甲 (作家乙)] 作品乙 [中国翻訳]'))).toEqual([
      { kind: 'work', text: '作品乙' },
      { kind: 'circle', text: 'サークル甲' },
      { kind: 'artist', text: '作家乙' },
    ])
  })

  // No Japanese field: the romanized title is all there is.
  it('falls back to the romanized title', () => {
    expect(searchTerms(gallery('[Circle Alpha (Artist Beta)] Work Beta', ''))).toEqual([
      { kind: 'work', text: 'Work Beta' },
      { kind: 'circle', text: 'Circle Alpha' },
      { kind: 'artist', text: 'Artist Beta' },
    ])
  })

  // A creator block without nesting does not say which role it names; it is
  // offered as the circle and left for the reader to correct.
  it('offers an unnested creator block as the circle', () => {
    expect(searchTerms(gallery('[Artist Beta] Work Beta', ''))).toEqual([
      { kind: 'work', text: 'Work Beta' },
      { kind: 'circle', text: 'Artist Beta' },
    ])
  })

  // The tags are EH's romanized names; they fill in only when the title has
  // no creator block, and other namespaces never become terms.
  it('takes creators from tags only when the title has none', () => {
    const tags = ['group:circle_alpha', 'artist:artist_beta', 'parody:original', 'language:chinese']
    expect(searchTerms(gallery('Work Beta', '', tags))).toEqual([
      { kind: 'work', text: 'Work Beta' },
      { kind: 'circle', text: 'circle alpha' },
      { kind: 'artist', text: 'artist beta' },
    ])
    expect(searchTerms(gallery('[Circle Alpha] Work Beta', '', tags))).toEqual([
      { kind: 'work', text: 'Work Beta' },
      { kind: 'circle', text: 'Circle Alpha' },
    ])
  })

  // A solo circle writes one name as both circle and artist. Each role leads
  // to different searches (a store's circle page, a pixiv profile), so the
  // name stays once per role.
  it('keeps a solo circle name in both roles', () => {
    expect(searchTerms(gallery('[Circle Alpha (Circle Alpha)] Work Beta', ''))).toEqual([
      { kind: 'work', text: 'Work Beta' },
      { kind: 'circle', text: 'Circle Alpha' },
      { kind: 'artist', text: 'Circle Alpha' },
    ])
  })
})

describe('googleQuery', () => {
  // The creator block and the work stay as the title writes them; the event
  // in front and the translation tag behind are left out, since they differ
  // between uploads of one book.
  it('keeps the creator block and the work, without the event and the release tag', () => {
    expect(googleQuery(gallery('(C104) [Circle Alpha (Artist Beta)] Work Beta [English]', '(C104) [サークル甲 (作家乙)] 作品乙 [英訳]'))).toBe('[サークル甲 (作家乙)] 作品乙')
  })

  // A series block after the work, and a release tag such as a digital
  // edition, are part of what surrounds the work, not of its name.
  it('drops the series block and digital tag after the work', () => {
    expect(googleQuery(gallery('[Circle Alpha] Work Beta (Series Gamma) [Digital]', ''))).toBe('[Circle Alpha] Work Beta')
  })

  // A title without a creator block searches on the work alone.
  it('searches the work alone when the title names no creator', () => {
    expect(googleQuery(gallery('Work Beta [Chinese]', ''))).toBe('Work Beta')
  })
})
