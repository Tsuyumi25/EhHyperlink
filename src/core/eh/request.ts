import type { Throttle } from './throttle'
import { isRecord } from './validation'

/**
 * Deadlines cover headers and body; retries consume the same throttle as initial
 * attempts. Restrictions and invalid protocol responses stop the remaining run.
 * Retry-After is remembered per origin so manual refetches respect it too.
 */

const MAX_ATTEMPTS = 3
const DEADLINE_MS = 30_000
const FIRST_BACKOFF_MS = 1000

const TRANSIENT_STATUS = [408, 500, 502, 503, 504]
const RESTRICTED_STATUS = [401, 403, 429]

const BODY_READERS = ['text', 'json', 'arrayBuffer', 'blob', 'formData']

export type FailureKind = 'network' | 'timeout' | 'http' | 'invalid-response'

export class RequestError extends Error {
  attempts = 1
  retryAt?: number

  constructor(
    public readonly kind: FailureKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'RequestError'
  }
}

/** Restrictions, invalid protocol and an active cooldown affect subsequent queries too. */
export function stopsRequests(error: RequestError): boolean {
  if (error.kind === 'invalid-response') return true
  if (error.kind !== 'http') return false
  if (RESTRICTED_STATUS.includes(error.status ?? 0)) return true
  return (error.retryAt ?? 0) > Date.now()
}

function worthRepeating(error: RequestError): boolean {
  if (error.kind === 'network') return true
  if (error.kind === 'timeout') return true
  if (error.kind === 'http') return TRANSIENT_STATUS.includes(error.status ?? 0)
  return false
}

type Outcome<T> =
  | { kind: 'answered'; data: T }
  | { kind: 'failed'; error: RequestError; retryAfterMs: number | null }

const cooldown = new Map<string, { until: number; status: number }>()

function pause(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

/** Browser and userscript realms can have different Error constructors. */
function transportError(error: unknown): RequestError {
  if (error instanceof RequestError) return error
  const name = isRecord(error) ? error.name : undefined
  const detail = error instanceof Error ? error.message : String(error)
  if (name === 'AbortError') return new RequestError('timeout', `no answer within ${DEADLINE_MS}ms`)
  if (name === 'TypeError') return new RequestError('network', `request failed: ${detail}`)
  return new RequestError('invalid-response', `request failed: ${detail}`)
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError'
}

/** Body transport failures can recover; exceptions in the caller's parser must escape. */
function watchBody(response: Response): Response {
  return new Proxy(response, {
    get(target, key) {
      const value: unknown = Reflect.get(target, key, target)
      if (typeof value !== 'function') return value
      const call = value as (...args: unknown[]) => unknown
      if (typeof key !== 'string') return call.bind(target)
      if (!BODY_READERS.includes(key)) return call.bind(target)
      return async (...args: unknown[]) => {
        try {
          return await call.apply(target, args)
        } catch (error) {
          throw transportError(error)
        }
      }
    },
  })
}

function retryAfterMs(response: Response): number | null {
  const header = response.headers.get('Retry-After')
  if (header === null) return null
  const text = header.trim()
  if (text === '') return null
  const seconds = Number(text)
  if (Number.isFinite(seconds)) {
    if (seconds < 0) return null
    return seconds * 1000
  }
  const at = Date.parse(text)
  if (Number.isNaN(at)) return null
  return Math.max(0, at - Date.now())
}

/** A longer server cooldown ends this run rather than sending before permission. */
function retryDelay(asked: number | null, backoffMs: number): number | null {
  if (asked === null) return backoffMs
  if (asked > DEADLINE_MS) return null
  return Math.max(asked, backoffMs)
}

function discard(response: Response): void {
  try {
    void response.body?.cancel().catch(() => {})
  } catch {
    // 已知 HTTP 錯誤優先於本文清理；清理失敗不應改成可重試的逾時。
  }
}

async function exchange<T>(url: string, init: RequestInit, read: (response: Response) => Promise<T>): Promise<Outcome<T>> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    throw transportError(error)
  }
  if (!response.ok) {
    discard(response)
    const asked = retryAfterMs(response)
    const error = new RequestError('http', `HTTP ${response.status}`, response.status)
    if (asked !== null) error.retryAt = Date.now() + asked
    return { kind: 'failed', error, retryAfterMs: asked }
  }
  try {
    return { kind: 'answered', data: await read(watchBody(response)) }
  } catch (error) {
    if (error instanceof RequestError) throw error
    if (isAbortError(error)) throw new RequestError('timeout', `body unfinished within ${DEADLINE_MS}ms`)
    throw error
  }
}

/** Racing the abort also bounds body readers that ignore cancellation. */
async function attempt<T>(url: string, init: RequestInit, read: (response: Response) => Promise<T>): Promise<Outcome<T>> {
  const controller = new AbortController()
  const expiry = Promise.withResolvers<never>()
  const timer = setTimeout(() => {
    controller.abort()
    expiry.reject(new RequestError('timeout', `no answer within ${DEADLINE_MS}ms`))
  }, DEADLINE_MS)
  try {
    return await Promise.race([exchange(url, { ...init, signal: controller.signal }, read), expiry.promise])
  } catch (error) {
    if (error instanceof RequestError) return { kind: 'failed', error, retryAfterMs: null }
    throw error
  } finally {
    clearTimeout(timer)
    controller.abort()
  }
}

/**
 * The caller rejects invalid content with RequestError('invalid-response').
 * A long cooldown fails with zero attempts. Each attempt owns init.signal.
 */
export async function request<T>(url: string, init: RequestInit, throttle: Throttle, read: (response: Response) => Promise<T>): Promise<{ data: T; attempts: number }> {
  let origin = url
  try {
    origin = new URL(url).origin
  } catch {
    // A caller's own relative URL is its own key; nothing here needs a real origin.
  }
  let attempts = 0
  let backoffMs = FIRST_BACKOFF_MS
  for (;;) {
    const holding = cooldown.get(origin)
    if (holding !== undefined) {
      const remainingMs = holding.until - Date.now()
      if (remainingMs > DEADLINE_MS) {
        const error = new RequestError('http', `host asked to wait ${remainingMs}ms`, holding.status)
        error.attempts = attempts
        error.retryAt = holding.until
        throw error
      }
      if (remainingMs > 0) await pause(remainingMs)
      cooldown.delete(origin)
    }
    attempts += 1
    await throttle.next()
    const outcome = await attempt(url, init, read)
    if (outcome.kind === 'answered') return { data: outcome.data, attempts }
    const error = outcome.error
    error.attempts = attempts
    if (error.retryAt !== undefined) cooldown.set(origin, { until: error.retryAt, status: error.status ?? 0 })
    if (!worthRepeating(error)) throw error
    if (attempts >= MAX_ATTEMPTS) throw error
    const waitMs = retryDelay(outcome.retryAfterMs, backoffMs)
    if (waitMs === null) throw error
    await pause(waitMs)
    backoffMs *= 2
  }
}
