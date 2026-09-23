import { cacheGet, cacheSet } from './cache'
import type { GalleryRef } from './ehUrl'
import type { MetadataRequest } from './requestLog'
import { metadataThrottle } from './throttle'
import { request, RequestError, stopsRequests } from './request'
import { isGalleryId, isNullableNumber, isNullableRating, isOptionalString, isOptionalStrings, isRating, isRecord, isStrings } from './validation'

/**
 * E-Hentai gallery metadata API (https://ehwiki.org/wiki/API).
 * POST JSON to api.e-hentai.org; 25 galleries per request; the wiki notes that
 * 4–5 sequential requests are fine before a ~5 s pause is needed. The API answers
 * with CORS for e-hentai.org / exhentai.org pages, so a plain `fetch` works.
 */

export const API_URL = 'https://api.e-hentai.org/api.php'
export const GALLERIES_PER_REQUEST = 25

export interface GalleryMetadata {
  gid: number
  title: string
  titleJpn: string
  category: string
  /** unix seconds; the API sends it as a decimal string */
  posted: number | null
  /** cover URL on the host's image domain, empty when the API has none */
  thumb: string
  /** 0–5, or null when nobody has rated the gallery */
  rating: number | null
  /** `namespace:tag` with spaces, as the API returns them */
  tags: string[]
}

/** What the API answered, keyed by gid, the POSTs it took, and how old the oldest answer is. */
export interface MetadataResponse {
  metadata: Map<number, GalleryMetadata>
  requests: MetadataRequest[]
  /** galleries answered from the cache; no request left for these */
  fromCache: number
  /** unix ms of the oldest answer in here */
  oldestAt: number
}

interface ApiEntry {
  gid: number
  title: string
  title_jpn?: string
  category?: string
  posted?: unknown
  thumb?: unknown
  rating?: unknown
  tags?: string[]
  error?: unknown
}

function isApiEntry(value: unknown): value is ApiEntry {
  return isRecord(value)
    && isGalleryId(value.gid)
    && typeof value.title === 'string'
    && value.error === undefined
    && isOptionalString(value.title_jpn)
    && isOptionalString(value.category)
    && isOptionalStrings(value.tags)
}

function isMetadataBody(value: unknown): value is { gmetadata: unknown[] } {
  return isRecord(value) && Array.isArray(value.gmetadata) && !('error' in value)
}

function isGalleryMetadata(value: unknown): value is GalleryMetadata {
  if (!isRecord(value)) return false
  if (!isGalleryId(value.gid)) return false
  for (const field of ['title', 'titleJpn', 'category', 'thumb']) {
    if (typeof value[field] !== 'string') return false
  }
  if (!isStrings(value.tags)) return false
  if (!isNullableNumber(value.posted)) return false
  return isNullableRating(value.rating)
}

/**
 * The API answers with HTML-escaped titles (`&amp;`, `&#039;`), while the search
 * page and the gallery page arrive through DOM text nodes and are decoded
 * already. Left escaped, the same gallery would read differently depending on
 * which route found it, and the trigram score would compare `&amp;` against `&`.
 *
 * A textarea decodes every named and numeric entity the same way the browser
 * does; its `innerHTML` is RCDATA, so nothing is parsed as markup.
 */
let decoder: HTMLTextAreaElement | null = null

function decodeEntities(value: string): string {
  if (!value.includes('&')) return value
  decoder ??= document.createElement('textarea')
  decoder.innerHTML = value
  return decoder.value
}

/** `"1277193600"` as the API writes it, or null when it is missing or not a number. */
function readPosted(value: unknown): number | null {
  const seconds = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : Number.NaN
  return Number.isFinite(seconds) ? seconds : null
}

/**
 * `"4.71"` as the API writes it. Zero means nobody has rated the gallery — the
 * API sends `"0.00"` rather than omitting the field — and an unrated gallery has
 * no stars to show, so it reads null.
 */
function readRating(value: unknown): number | null {
  const rating = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : Number.NaN
  return isRating(rating) ? rating : null
}

/** Metadata entries out of one API response body; malformed or errored entries are skipped. */
export function parseMetadataResponse(body: unknown): GalleryMetadata[] {
  if (!isMetadataBody(body)) throw new RequestError('invalid-response', 'Expected gallery metadata')
  const entries: GalleryMetadata[] = []
  for (const raw of body.gmetadata) {
    if (!isApiEntry(raw)) continue
    entries.push({
      gid: raw.gid,
      title: decodeEntities(raw.title),
      titleJpn: decodeEntities(raw.title_jpn ?? ''),
      category: raw.category ?? '',
      posted: readPosted(raw.posted),
      thumb: typeof raw.thumb === 'string' ? raw.thumb : '',
      rating: readRating(raw.rating),
      tags: raw.tags ?? [],
    })
  }
  return entries
}

async function requestChunk(refs: readonly GalleryRef[]): Promise<{ data: GalleryMetadata[]; attempts: number }> {
  return request(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'gdata', gidlist: refs.map((ref) => [ref.gid, ref.token]), namespace: 1 }),
  }, metadataThrottle, async (response) => {
    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      if (error instanceof SyntaxError) throw new RequestError('invalid-response', 'Invalid metadata JSON')
      throw error
    }
    return parseMetadataResponse(body)
  })
}

/**
 * Metadata for every ref the API knows, with failed batches and missing entries
 * retained in the request log so callers can distinguish incomplete results.
 *
 * The cache is per gallery, so only the refs nobody has asked about are batched.
 * Two books by one creator return overlapping search results, and the second one
 * asks the API about almost nothing.
 */
export async function fetchGalleryMetadata(refs: readonly GalleryRef[], force = false): Promise<MetadataResponse> {
  const metadata = new Map<number, GalleryMetadata>()
  const requests: MetadataRequest[] = []
  const missing: GalleryRef[] = []
  let oldest = Number.POSITIVE_INFINITY
  for (const ref of refs) {
    const cached = force ? null : await cacheGet(`gid:${ref.gid}`, isGalleryMetadata)
    if (cached) {
      metadata.set(ref.gid, cached.data)
      oldest = Math.min(oldest, cached.at)
    } else missing.push(ref)
  }
  for (let index = 0; index < missing.length; index += GALLERIES_PER_REQUEST) {
    const chunk = missing.slice(index, index + GALLERIES_PER_REQUEST)
    const entry: MetadataRequest = { kind: 'metadata', url: API_URL, galleries: chunk.length, attempts: 0, failedGalleries: chunk.length }
    requests.push(entry)
    try {
      const response = await requestChunk(chunk)
      entry.attempts = response.attempts
      const expected = new Set(chunk.map((ref) => ref.gid))
      const accepted = response.data.filter((item) => expected.has(item.gid))
      for (const item of accepted) metadata.set(item.gid, item)
      entry.failedGalleries = chunk.filter((ref) => !metadata.has(ref.gid)).length
      for (const item of accepted) await cacheSet(`gid:${item.gid}`, item)
      oldest = Math.min(oldest, Date.now())
    } catch (error) {
      if (!(error instanceof RequestError)) throw error
      entry.error = error
      entry.attempts = error.attempts
      if (stopsRequests(error)) break
    }
  }
  return { metadata, requests, fromCache: refs.length - missing.length, oldestAt: Number.isFinite(oldest) ? oldest : Date.now() }
}
