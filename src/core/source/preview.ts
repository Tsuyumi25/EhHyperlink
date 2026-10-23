import type { GoogleResult } from './googleResults'

/**
 * A Google search the gallery page opened in a background tab and waits on.
 * The tab finds its request by the search it shows — the query and the result
 * offset (`start`) — so the URL it opens is a plain search URL, the same one
 * the popup links to, and two pages of one query are two requests.
 */
export interface PreviewRequest {
  id: string
  key: string
  at: number
}

/** `unavailable`: the userscript manager gives this script no way to open a tab. */
export type PreviewStatus = 'ok' | 'empty' | 'blocked' | 'unavailable'

export interface PreviewAnswer {
  status: PreviewStatus
  results: GoogleResult[]
}

/** Google pages its results ten at a time through `start`. */
export const RESULTS_PER_PAGE = 10

/** A tab that has not answered by now never will; its request stops matching. */
export const PREVIEW_TTL_MS = 60_000

export function isFresh(request: PreviewRequest, now: number): boolean {
  return now - request.at <= PREVIEW_TTL_MS
}

/** The search a Google URL shows, as the key a request is filed under; null without a query. */
export function searchKey(url: URL): string | null {
  const query = url.searchParams.get('q')
  if (query === null) return null
  return `${query}\u0000${url.searchParams.get('start') ?? '0'}`
}

/** The newest unexpired request for this search, if the gallery page made one. */
export function requestFor(requests: readonly PreviewRequest[], key: string, now: number): PreviewRequest | null {
  const matching = requests.filter((request) => request.key === key && isFresh(request, now))
  return matching.at(-1) ?? null
}

/**
 * The search a Google page answers for. On the "unusual traffic" page
 * (`/sorry/index`) the search waits in the `continue` URL, and the request is
 * answered as blocked instead of hanging until it times out.
 */
export function searchOf(url: URL): { key: string; blocked: boolean } | null {
  if (url.pathname.startsWith('/sorry')) {
    const next = url.searchParams.get('continue')
    if (!next) return null
    const key = searchKey(new URL(next))
    return key === null ? null : { key, blocked: true }
  }
  const key = searchKey(url)
  return key === null ? null : { key, blocked: false }
}
