import { readCategory } from './category'

export interface SourceGallery {
  gid: number
  title: string
  titleJpn: string
  category: string
  /** `namespace:tag` as EH writes them in element ids, spaces as underscores */
  tags: string[]
}

/** Read a gallery from the EH gallery box (`.gm`, or the whole gallery page); null when it carries no title. */
export function readSourceGallery(root: ParentNode, gid: number): SourceGallery | null {
  const title = root.querySelector('#gn')?.textContent?.trim() ?? ''
  if (!title) return null
  return {
    gid,
    title,
    titleJpn: root.querySelector('#gj')?.textContent?.trim() ?? '',
    category: readCategory(root.querySelector('#gdc .cs, #gdc .cn')),
    tags: [...root.querySelectorAll('#taglist [id^="td_"]')].map((element) => element.id.slice('td_'.length)),
  }
}
