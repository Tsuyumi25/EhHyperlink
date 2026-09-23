import { stopsRequests, type RequestError } from './request'

export interface SearchRequest {
  kind: 'search'
  url: string
  /** complete `f_search` query before URL encoding */
  term: string
  hitCount: number | null
  attempts: number
  error?: RequestError
  /** answered from the cache; no request left the browser */
  cached?: boolean
}

export interface MetadataRequest {
  kind: 'metadata'
  url: string
  /** galleries asked for in this POST body; the API takes 25 at a time */
  galleries: number
  attempts: number
  failedGalleries: number
  error?: RequestError
}

export type SentRequest = SearchRequest | MetadataRequest

export function requestFailed(entry: SentRequest): boolean {
  if (entry.error) return true
  return entry.kind === 'metadata' ? entry.failedGalleries > 0 : false
}

export function requestStopsRun(entry: SentRequest): boolean {
  return entry.error ? stopsRequests(entry.error) : false
}

function completedSearch(entry: SentRequest): boolean {
  return entry.kind === 'search' && !entry.error
}

export function resultStatus(requests: readonly SentRequest[]): 'complete' | 'partial' | 'failed' {
  if (!requests.some(requestFailed)) return 'complete'
  return requests.some(completedSearch) ? 'partial' : 'failed'
}
