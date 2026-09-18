/**
 * What one run asked for, in order, and whether each one left the browser.
 *
 * A request is recorded when it leaves, so a chunk the API refused still appears
 * here: it counted against the host either way. Requests the planner decided
 * against never appear, which is how a run that sent nothing (an
 * `other:ai generated` source) reads as an empty list rather than as a failure.
 *
 * A response the cache answered is recorded too, marked `cached` — the panel is
 * there to say what this run did to someone else's server, and "nothing" is the
 * most useful thing it can say.
 */
export interface SearchRequest {
  kind: 'search'
  url: string
  /** the quoted work phrase sent as `title:"…"`, before URL encoding */
  term: string
  /** answered from the cache; no request left the browser */
  cached?: boolean
}

export interface MetadataRequest {
  kind: 'metadata'
  url: string
  /** galleries asked for in this POST body; the API takes 25 at a time */
  galleries: number
}

export type SentRequest = SearchRequest | MetadataRequest
