/**
 * One request pace per host.
 *
 * ehwiki documents the API side only, and in the language of an observation:
 * "4-5 sequential requests usually okay before having to wait for ~5 seconds"
 * (https://ehwiki.org/wiki/API). The search pages have no documented limit, so
 * the number below comes from what other tools settled on: `e-hentai-db`, a
 * daily sync crawler, sleeps 1 second between every search page and every
 * metadata batch; `gallery-dl` waits a random 3–6 seconds, sized for a tool that
 * sends hundreds of requests in a row rather than the handful one gallery needs.
 *
 * The wait is measured from the last request that actually left, so a cached
 * response costs nothing and does not hold up the request behind it.
 */

/** One second between search pages, the pace a daily crawler has run at for years. */
export const SEARCH_INTERVAL_MS = 1000

/** The same spacing for the API, plus the longer pause ehwiki asks for every fourth request. */
export const METADATA_INTERVAL_MS = 1000
export const METADATA_PAUSE_EVERY = 4
export const METADATA_PAUSE_MS = 5000

function pause(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

/** A request pace, held per host so that two hosts never queue behind each other. */
export interface Throttle {
  /** Resolves when the next request to this host may leave. */
  next(): Promise<void>
}

export interface ThrottleOptions {
  intervalMs: number
  /** After this many requests, wait `pauseMs` instead of the interval. */
  pauseEvery?: number
  pauseMs?: number
}

export function createThrottle({ intervalMs, pauseEvery, pauseMs }: ThrottleOptions): Throttle {
  let lastAt = 0
  let sent = 0
  return {
    async next() {
      const longPause = pauseEvery !== undefined && pauseMs !== undefined && sent > 0 && sent % pauseEvery === 0
      const wait = (longPause ? pauseMs : intervalMs) - (Date.now() - lastAt)
      if (wait > 0) await pause(wait)
      lastAt = Date.now()
      sent += 1
    },
  }
}

/** The two paces this script keeps: one per host. */
export const searchThrottle = createThrottle({ intervalMs: SEARCH_INTERVAL_MS })
export const metadataThrottle = createThrottle({
  intervalMs: METADATA_INTERVAL_MS,
  pauseEvery: METADATA_PAUSE_EVERY,
  pauseMs: METADATA_PAUSE_MS,
})
