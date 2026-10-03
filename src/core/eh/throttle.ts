/**
 * The search interval is measured from the last request that actually left, so a cached
 * response costs nothing and does not hold up the request behind it.
 */

/** One second between search pages, the pace a daily crawler has run at for years. */
export const SEARCH_INTERVAL_MS = 1000

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
}

export function createThrottle({ intervalMs }: ThrottleOptions): Throttle {
  let lastAt = 0
  return {
    async next() {
      const wait = intervalMs - (Date.now() - lastAt)
      if (wait > 0) await pause(wait)
      lastAt = Date.now()
    },
  }
}

export const searchThrottle = createThrottle({ intervalMs: SEARCH_INTERVAL_MS })
