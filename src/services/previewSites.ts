import { dlsiteHasNextPage, dlsitePageUrl, dlsiteResultState, dlsiteSearchOf, readDlsiteResults } from '@/core/source/dlsite'
import { googlePageUrl, googleResultsArea, googleSearchOf, isGoogleRedirect, readGoogleResults } from '@/core/source/google'
import { isPixivUserSearch, pixivApiUrl, pixivPageUrl, pixivSearchOf, pixivUserWorksUrl, readPixivResults, readPixivUserWorks } from '@/core/source/pixiv'
import type { PreviewAnswer, SearchOnPage } from '@/core/source/preview'
import { resolveRedirect } from '@/services/redirect'

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
    // The reader copies and opens the site itself, not Google's redirect to it;
    // a link that does not resolve stays Google's, which still leads there.
    await Promise.all(
      results.filter((result) => isGoogleRedirect(result.href)).map(async (result) => {
        result.href = (await resolveRedirect(result.href)) ?? result.href
      }),
    )
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
    const answer: PreviewAnswer = { status: results.length > 0 ? 'ok' : 'empty', results }
    if (!dlsiteHasNextPage(document)) answer.last = true
    return answer
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
      const answer = readPixivResults(await response.json(), url)
      // A user search lists people; each row also shows their latest works,
      // which tell two creators of the same name apart. One profile request per user.
      if (!isPixivUserSearch(url)) return answer
      await Promise.all(
        answer.results.map(async (result) => {
          const worksUrl = pixivUserWorksUrl(result.href)
          if (!worksUrl) return
          try {
            result.works = readPixivUserWorks(await (await fetch(worksUrl, { credentials: 'include' })).json())
          } catch {
            // a user whose profile does not load keeps the row without works
          }
        }),
      )
      return answer
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
