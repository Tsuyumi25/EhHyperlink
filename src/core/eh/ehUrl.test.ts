import { describe, expect, it } from 'vitest'
import { mpvGalleryId } from './ehUrl'

describe('Multi-Page Viewer gallery id', () => {
  it('reads the gid the viewer puts in its path', () => {
    expect(mpvGalleryId('/mpv/1000/0a0a0a0a0a/')).toBe(1000)
  })

  it('leaves other pages and malformed paths alone', () => {
    expect(mpvGalleryId('/g/1000/0a0a0a0a0a/')).toBeNull()
    expect(mpvGalleryId('/s/0a0a0a0a0a/1000-12')).toBeNull()
    expect(mpvGalleryId('/mpv/')).toBeNull()
    expect(mpvGalleryId('/mpv/1000/')).toBeNull()
    expect(mpvGalleryId('/mpv/1000/0a0a0a0a0a/extra')).toBeNull()
    expect(mpvGalleryId('/mpv/abc/0a0a0a0a0a/')).toBeNull()
  })
})
