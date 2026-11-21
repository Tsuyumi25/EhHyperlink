import { whitespaceRun } from '../title/pattern'

export interface GalleryRef {
  gid: number
  token: string
}

/** Gallery id and token from an EH gallery path or URL of the form `/g/<gid>/<token>/`; null for anything else. */
export function galleryRef(hrefOrPath: string): GalleryRef | null {
  let pathname = hrefOrPath
  if (hrefOrPath.includes('://')) {
    try {
      pathname = new URL(hrefOrPath).pathname
    } catch {
      return null
    }
  }
  const [, section, gid, token] = pathname.split('/')
  if (section !== 'g' || !gid || !token) return null
  if (![...gid].every((character) => character >= '0' && character <= '9')) return null
  return { gid: Number(gid), token }
}

/** Gallery id from a Multi-Page Viewer path `/mpv/<gid>/<token>/`; null for anything else. */
export function mpvGalleryId(pathname: string): number | null {
  const [, section, gid, token, ...rest] = pathname.split('/')
  if (section !== 'mpv' || !gid || !token) return null
  if (rest.some(Boolean)) return null
  if (![...gid].every((character) => character >= '0' && character <= '9')) return null
  return Number(gid)
}

/** `18 pages` / `1 page` as EH prints it in list cells; null for any other text. */
export function pageCount(text: string): number | null {
  const [count, unit, ...rest] = text.trim().split(whitespaceRun)
  if (rest.length > 0 || !count || (unit !== 'pages' && unit !== 'page')) return null
  if (![...count].every((character) => character >= '0' && character <= '9')) return null
  return Number(count)
}
