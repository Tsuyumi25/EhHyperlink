import { dlsitePageUrl, dlsiteResultState, dlsiteSearchOf, readDlsiteResults } from '@/core/source/dlsite'
import { googlePageUrl, googleResultsArea, googleSearchOf, readGoogleResults } from '@/core/source/google'
import { pixivApiUrl, pixivPageUrl, pixivSearchOf, readPixivResults } from '@/core/source/pixiv'
import type { PreviewAnswer, SearchOnPage } from '@/core/source/preview'

/** How long a background tab waits for its results to render. */
const RENDER_TIMEOUT_MS = 8_000

/**
 * One site the popup can preview: how a page of it says which search it
 * shows, how to reach the next page, and how to read the results off it from
 * inside its own tab.
 */
export interface PreviewSite {
  id: string
  searchOf: (url: URL) => SearchOnPage | null
  /** page `page` (0-based) of the search at `url` */
  pageUrl: (url: string, page: number) => string
  /** runs in the site's tab, signed in as the reader */
  read: (url: URL) => Promise<PreviewAnswer>
}

async function pause(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  window.setTimeout(resolve, ms)
  await promise
}

/** Poll `ready` until it gives a value or `RENDER_TIMEOUT_MS` passes; null on timeout. */
async function rendered<T>(ready: () => T | null): Promise<T | null> {
  const started = Date.now()
  for (;;) {
    const value = ready()
    if (value !== null) return value
    if (Date.now() - started > RENDER_TIMEOUT_MS) return null
    await pause(250)
  }
}

const GOOGLE: PreviewSite = {
  id: 'google',
  searchOf: googleSearchOf,
  pageUrl: googlePageUrl,
  async read() {
    const area = await rendered(() => googleResultsArea(document))
    if (!area) return { status: 'unreadable', results: [] }
    // The area appears before its first result does; give the results the rest of the wait.
    await rendered(() => (document.querySelector('#search a h3') ? true : null))
    const results = readGoogleResults(document)
    return { status: results.length > 0 ? 'ok' : 'empty', results }
  },
}

const DLSITE: PreviewSite = {
  id: 'dlsite',
  searchOf: dlsiteSearchOf,
  pageUrl: dlsitePageUrl,
  async read() {
    const state = await rendered(() => dlsiteResultState(document))
    if (state === null) return { status: 'unreadable', results: [] }
    const results = state === 'results' ? readDlsiteResults(document) : []
    return { status: results.length > 0 ? 'ok' : 'empty', results }
  },
}

const PIXIV: PreviewSite = {
  id: 'pixiv',
  searchOf: pixivSearchOf,
  pageUrl: pixivPageUrl,
  async read(url) {
    const api = pixivApiUrl(url)
    if (!api) return { status: 'unreadable', results: [] }
    try {
      const response = await fetch(api, { credentials: 'include' })
      return readPixivResults(await response.json(), url)
    } catch {
      return { status: 'unreadable', results: [] }
    }
  },
}

const SITES: readonly PreviewSite[] = [GOOGLE, DLSITE, PIXIV]

/** The site whose search `url` is, if the popup can preview it. */
export function previewSiteFor(url: URL): PreviewSite | null {
  return SITES.find((site) => site.searchOf(url) !== null) ?? null
}
