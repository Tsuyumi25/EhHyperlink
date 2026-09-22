import type { SourceGallery } from '../eh/galleryPage'

export type GalleryInput = string | Partial<SourceGallery>

export function gallery(input: GalleryInput): SourceGallery {
  const fields = typeof input === 'string' ? { title: input } : input
  return { gid: 1000, title: '', titleJpn: '', category: 'Doujinshi', tags: [], ...fields }
}
