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

export function requestFailed(entry: SearchRequest): boolean {
  return entry.error !== undefined
}

export function requestStopsRun(entry: SearchRequest): boolean {
  return entry.error ? stopsRequests(entry.error) : false
}

export function resultStatus(requests: readonly SearchRequest[]): 'complete' | 'partial' | 'failed' {
  if (!requests.some(requestFailed)) return 'complete'
  return requests.some((entry) => !entry.error) ? 'partial' : 'failed'
}
