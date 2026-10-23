import type { GoogleResult } from './googleResults'

/**
 * A Google search the gallery page opened in a background tab and waits on.
 * The tab is opened with the request's id in its fragment and answers that
 * request; the fragment survives Google's redirect to a country domain
 * (observed 2026-10), so two gallery tabs previewing the same search each get
 * their own answer. `key` — the query and result offset — is the fallback for
 * a page that lost the fragment, such as the "unusual traffic" page.
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

/** The request a page answers: the one its fragment names, or by its search when the fragment is gone. */
export function requestOf(requests: readonly PreviewRequest[], url: URL, key: string, now: number): PreviewRequest | null {
  const id = requestIdOf(url)
  if (id === null) return requestFor(requests, key, now)
  return requests.filter((request) => isFresh(request, now)).find((request) => request.id === id) ?? null
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
