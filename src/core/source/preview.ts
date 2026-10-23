/**
 * A search the gallery page opened in a background tab and waits on. The tab
 * is opened with the request's id in its fragment and answers that request;
 * the fragment survives Google's redirect to a country domain (observed
 * 2026-10), so two gallery tabs previewing the same search each get their own
 * answer. `key` — the search and the page of it, as each site's reader names
 * them — is the fallback for a page that lost the fragment, such as Google's
 * "unusual traffic" page or a site that rewrites its URL as it loads.
 */
export interface PreviewRequest {
  id: string
  key: string
  at: number
}

/** One result as the site lists it, reduced to what the popup shows. */
export interface PreviewResult {
  title: string
  href: string
  /** whose icon to show; null when the result does not say where it leads */
  origin: string | null
  /** the line under the title: a breadcrumb, a circle and its authors, an artist */
  byline: string
  snippet: string
}

/**
 * `blocked`: the site asked to prove the reader is human.
 * `unreadable`: the page loaded but showed neither results nor "no results" —
 * an age check, a sign-in page, or markup this reader no longer knows.
 * `unavailable`: the userscript manager gives this script no way to open a tab.
 */
export type PreviewStatus = 'ok' | 'empty' | 'blocked' | 'unreadable' | 'unavailable'

export interface PreviewAnswer {
  status: PreviewStatus
  results: PreviewResult[]
}

/** What a site's page says about itself: which search it shows, and whether it is a "prove you are human" page. */
export interface SearchOnPage {
  key: string
  blocked: boolean
}

/** A tab that has not answered by now never will; its request stops matching. */
export const PREVIEW_TTL_MS = 60_000

export function isFresh(request: PreviewRequest, now: number): boolean {
  return now - request.at <= PREVIEW_TTL_MS
}

const ID_FIELD = 'ehl-preview'

/** `url` with the request id in its fragment, which the search itself never reads. */
export function withRequestId(url: string, id: string): string {
  const target = new URL(url)
  target.hash = `${ID_FIELD}=${id}`
  return target.href
}

export function requestIdOf(url: URL): string | null {
  return new URLSearchParams(url.hash.slice(1)).get(ID_FIELD)
}

/** The newest unexpired request for this search, if the gallery page made one. */
export function requestFor(requests: readonly PreviewRequest[], key: string, now: number): PreviewRequest | null {
  const matching = requests.filter((request) => request.key === key && isFresh(request, now))
  return matching.at(-1) ?? null
}

/** The request a page answers: the one its fragment names, or by its search when the fragment is gone. */
export function requestOf(requests: readonly PreviewRequest[], url: URL, key: string, now: number): PreviewRequest | null {
  const id = requestIdOf(url)
  if (id === null) return requestFor(requests, key, now)
  return requests.filter((request) => isFresh(request, now)).find((request) => request.id === id) ?? null
}
