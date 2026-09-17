import { readCategory } from './category'
import { galleryRef } from './ehUrl'

export interface SourceGallery {
  gid: number
  title: string
  titleJpn: string
  category: string
  /** `namespace:tag` as EH writes them in element ids, spaces as underscores */
  tags: string[]
}

/** Read the current gallery from the EH gallery page DOM; null when this is not a gallery page. */
export function readSourceGallery(root: Document = document, pathname: string = location.pathname): SourceGallery | null {
  const ref = galleryRef(pathname)
  const title = root.querySelector('#gn')?.textContent?.trim() ?? ''
  if (ref === null || !title) return null
  return {
    gid: ref.gid,
    title,
    titleJpn: root.querySelector('#gj')?.textContent?.trim() ?? '',
    category: readCategory(root.querySelector('#gdc .cs, #gdc .cn')),
    tags: [...root.querySelectorAll('#taglist [id^="td_"]')].map((element) => element.id.slice('td_'.length)),
  }
}
