import type { GoogleResult } from './googleResults'

/**
 * A Google search the gallery page opened in a background tab and waits on.
 * The tab finds its request by the `q` it was opened with, so the URL it opens
 * is the same search URL the panel links to.
 */
export interface PreviewRequest {
  id: string
  query: string
  at: number
}

/** `unavailable`: the userscript manager gives this script no way to open a tab. */
export type PreviewStatus = 'ok' | 'empty' | 'blocked' | 'unavailable'

export interface PreviewAnswer {
  status: PreviewStatus
  results: GoogleResult[]
}

/** A tab that has not answered by now never will; its request stops matching. */
export const PREVIEW_TTL_MS = 60_000

export function isFresh(request: PreviewRequest, now: number): boolean {
  return now - request.at <= PREVIEW_TTL_MS
}

/** The newest unexpired request for this query, if the gallery page made one. */
export function requestFor(requests: readonly PreviewRequest[], query: string, now: number): PreviewRequest | null {
  const matching = requests.filter((request) => request.query === query && isFresh(request, now))
  return matching.at(-1) ?? null
}

/**
 * The `q` a Google page answers for. On the "unusual traffic" page
 * (`/sorry/index`) the search waits in the `continue` URL, and the request is
 * answered as blocked instead of hanging until it times out.
 */
export function queryOf(url: URL): { query: string; blocked: boolean } | null {
  if (url.pathname.startsWith('/sorry')) {
    const next = url.searchParams.get('continue')
    if (!next) return null
    const query = new URL(next).searchParams.get('q')
    return query === null ? null : { query, blocked: true }
  }
  const query = url.searchParams.get('q')
  return query === null ? null : { query, blocked: false }
}
