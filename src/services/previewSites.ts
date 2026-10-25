import { duckDuckGoNextForm, duckDuckGoPageOf, duckDuckGoPageUrl, duckDuckGoSearchOf, isDuckDuckGoResultPage, readDuckDuckGoResults } from '@/core/source/duckduckgo'
import { dlsiteHasNextPage, dlsitePageUrl, dlsiteResultState, dlsiteSearchOf, readDlsiteResults } from '@/core/source/dlsite'
import { googlePageUrl, googleResultsComplete, googleSearchOf, isGoogleRedirect, readGoogleResults } from '@/core/source/google'
import { isPixivUserSearch, pixivApiUrl, pixivPageUrl, pixivSearchOf, pixivUserWorksUrl, readPixivResults, readPixivUserWorks } from '@/core/source/pixiv'
import type { PreviewAnswer, SearchOnPage } from '@/core/source/preview'
import type { Trace } from '@/services/debugLog'
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
  /** runs in the site's tab, signed in as the reader; `trace` writes to the debug log */
  read: (url: URL, trace: Trace) => Promise<PreviewAnswer>
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
  async read(_url, trace) {
    const complete = await rendered(() => googleResultsComplete(document))
    if (!complete) return { status: 'unreadable', results: [] }
    const results = readGoogleResults(document)
    // The reader copies and opens the site itself, not Google's redirect to it;
    // a link that does not resolve stays Google's, which still leads there.
    await Promise.all(
      results.filter((result) => isGoogleRedirect(result.href)).map(async (result) => {
        result.href = (await resolveRedirect(result.href, trace)) ?? result.href
      }),
    )
    return { status: results.length > 0 ? 'ok' : 'empty', results }
  },
}

/**
 * Post the "Next" form of `page` and parse what comes back: DuckDuckGo pages
 * only that way. Same-origin from the search's own tab, so the request is the
 * one the reader's own press would send.
 */
async function nextDuckDuckGoPage(page: Document): Promise<Document | null> {
  const form = duckDuckGoNextForm(page)
  if (!form) return null
  const fields = [...new FormData(form)].map(([name, value]): [string, string] => [name, String(value)])
  const response = await fetch(form.action, { method: 'POST', body: new URLSearchParams(fields) })
  return new DOMParser().parseFromString(await response.text(), 'text/html')
}

const DUCKDUCKGO: PreviewSite = {
  id: 'duckduckgo',
  searchOf: duckDuckGoSearchOf,
  pageUrl: duckDuckGoPageUrl,
  async read(url) {
    let page: Document = document
    for (let left = duckDuckGoPageOf(url); left > 0; left--) {
      let next: Document | null
      try {
        next = await nextDuckDuckGoPage(page)
      } catch {
        return { status: 'unreadable', results: [] }
      }
      if (!next) return { status: 'empty', results: [], last: true }
      page = next
    }
    if (!isDuckDuckGoResultPage(page)) return { status: 'unreadable', results: [] }
    const results = readDuckDuckGoResults(page)
    const answer: PreviewAnswer = { status: results.length > 0 ? 'ok' : 'empty', results }
    if (!duckDuckGoNextForm(page)) answer.last = true
    return answer
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

const SITES: readonly PreviewSite[] = [GOOGLE, DUCKDUCKGO, DLSITE, PIXIV]

/** The site whose search `url` is, if the popup can preview it. */
export function previewSiteFor(url: URL): PreviewSite | null {
  return SITES.find((site) => site.searchOf(url) !== null) ?? null
}
