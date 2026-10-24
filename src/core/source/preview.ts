/**
 * A search the gallery page opened in a background tab and waits on. The tab
 * is opened with the request's id in its fragment and answers that id without
 * reading storage: Violentmonkey hands a new tab the values it had when the
 * tab started, which may predate the request the opener just wrote, so a tab
 * that looked the request up found nothing and never answered. The id carries
 * its own time for the freshness check. The fragment survives Google's
 * redirect to a country domain (observed 2026-10), so two gallery tabs
 * previewing the same search each get their own answer. `key` — the search and the page of it, as each site's reader names
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
  /** the icon the site itself drew for the result, where it draws one; shown in place of `origin`'s */
  icon: string | null
  /** the line under the title: a breadcrumb, a circle and its authors, an artist */
  byline: string
  snippet: string
  /** a cover or avatar, where the site shows one with each result */
  thumb: string | null
  /** a creator's latest works, for results that are creators rather than works */
  works: PreviewWork[]
}

export interface PreviewWork {
  href: string
  thumb: string
  title: string
}

/**
 * `blocked`: the site asked to prove the reader is human.
 * `unreadable`: the page loaded but showed neither results nor "no results" —
 * an age check, a sign-in page, or markup this reader no longer knows.
 * `unavailable`: the userscript manager gives this script no way to open a tab.
 * `closed`: something else closed the tab before it answered — another
 * extension that caps how many tabs may be open, say.
 */
export type PreviewStatus = 'ok' | 'empty' | 'blocked' | 'unreadable' | 'unavailable' | 'closed'

export interface PreviewAnswer {
  status: PreviewStatus
  results: PreviewResult[]
  /** set where the site's own pager says no page follows this one */
  last?: true
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

/** A request id: when it was made, in base 36, then `salt` to tell apart requests of the same millisecond. */
export function newRequestId(now: number, salt: string): string {
  return `${now.toString(36)}.${salt}`
}

export function requestIdOf(url: URL): string | null {
  return new URLSearchParams(url.hash.slice(1)).get(ID_FIELD)
}

const DEBUG_FIELD = 'ehl-debug'

/** `url` (already carrying a request id) asking its tab to trace what it does; the tab learns it from the URL, not from settings it may not see yet. */
export function withDebugTrace(url: string): string {
  const target = new URL(url)
  const fields = new URLSearchParams(target.hash.slice(1))
  fields.set(DEBUG_FIELD, '1')
  target.hash = fields.toString()
  return target.href
}

export function isTraced(url: URL): boolean {
  return new URLSearchParams(url.hash.slice(1)).has(DEBUG_FIELD)
}

/** The id in `url`'s fragment while its request is fresh; null without one, or once it expired. */
export function freshRequestIdOf(url: URL, now: number): string | null {
  const id = requestIdOf(url)
  if (id === null) return null
  const at = Number.parseInt(id.split('.')[0], 36)
  return isFresh({ id, key: '', at }, now) ? id : null
}

/** The newest unexpired request for this search, if the gallery page made one. */
export function requestFor(requests: readonly PreviewRequest[], key: string, now: number): PreviewRequest | null {
  const matching = requests.filter((request) => request.key === key && isFresh(request, now))
  return matching.at(-1) ?? null
}

