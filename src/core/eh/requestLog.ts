/**
 * What one run actually sent over the network, in send order.
 *
 * A request is recorded when it leaves the browser, so a chunk the API refused
 * still appears here: it counted against the host either way. Requests the
 * planner decided against never appear, which is how a run that sent nothing
 * (an `other:ai generated` source) reads as an empty list rather than as a
 * failure.
 */
export interface SearchRequest {
  kind: 'search'
  url: string
  /** the quoted work phrase sent as `title:"…"`, before URL encoding */
  term: string
}

export interface MetadataRequest {
  kind: 'metadata'
  url: string
  /** galleries asked for in this POST body; the API takes 25 at a time */
  galleries: number
}

export type SentRequest = SearchRequest | MetadataRequest
