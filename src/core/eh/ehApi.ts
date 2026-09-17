import type { GalleryRef } from './ehUrl'

/**
 * E-Hentai gallery metadata API (https://ehwiki.org/wiki/API).
 * POST JSON to api.e-hentai.org; 25 galleries per request; the wiki notes that
 * 4–5 sequential requests are fine before a ~5 s pause is needed. The API answers
 * with CORS for e-hentai.org / exhentai.org pages, so a plain `fetch` works.
 */

export const API_URL = 'https://api.e-hentai.org/api.php'
export const GALLERIES_PER_REQUEST = 25
const REQUESTS_BEFORE_PAUSE = 4
const PAUSE_MS = 5000

export interface GalleryMetadata {
  gid: number
  title: string
  titleJpn: string
  category: string
  /** `namespace:tag` with spaces, as the API returns them */
  tags: string[]
}

interface ApiEntry {
  gid: number
  title?: string
  title_jpn?: string
  category?: string
  tags?: string[]
  error?: string
}

function isApiEntry(value: unknown): value is ApiEntry {
  return typeof value === 'object' && value !== null && 'gid' in value && typeof value.gid === 'number'
}

/** Metadata entries out of one API response body; malformed or errored entries are skipped. */
export function parseMetadataResponse(body: unknown): GalleryMetadata[] {
  if (typeof body !== 'object' || body === null || !('gmetadata' in body) || !Array.isArray(body.gmetadata)) return []
  const entries: GalleryMetadata[] = []
  for (const raw of body.gmetadata) {
    if (!isApiEntry(raw) || raw.error !== undefined || typeof raw.title !== 'string') continue
    entries.push({
      gid: raw.gid,
      title: raw.title,
      titleJpn: raw.title_jpn ?? '',
      category: raw.category ?? '',
      tags: raw.tags ?? [],
    })
  }
  return entries
}

async function requestChunk(refs: readonly GalleryRef[]): Promise<GalleryMetadata[]> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'gdata', gidlist: refs.map((ref) => [ref.gid, ref.token]), namespace: 1 }),
  })
  if (!response.ok) throw new Error(`gallery metadata failed: HTTP ${response.status}`)
  return parseMetadataResponse(await response.json())
}

function pause(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

/** Metadata for every ref the API knows, keyed by gid. A failed chunk drops its galleries; the rest still return. */
export async function fetchGalleryMetadata(refs: readonly GalleryRef[]): Promise<Map<number, GalleryMetadata>> {
  const found = new Map<number, GalleryMetadata>()
  for (let index = 0; index < refs.length; index += GALLERIES_PER_REQUEST) {
    const chunkNumber = index / GALLERIES_PER_REQUEST
    if (chunkNumber > 0 && chunkNumber % REQUESTS_BEFORE_PAUSE === 0) await pause(PAUSE_MS)
    try {
      for (const entry of await requestChunk(refs.slice(index, index + GALLERIES_PER_REQUEST))) found.set(entry.gid, entry)
    } catch (error) {
      console.warn('[EhHyperlink] metadata chunk skipped', error)
    }
  }
  return found
}
