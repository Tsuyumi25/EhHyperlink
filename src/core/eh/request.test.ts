import { runInNewContext } from 'node:vm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequestError, request, stopsRequests } from './request'
import type { Throttle } from './throttle'

/**
 * The cooldown a `Retry-After` leaves behind is held per origin for the page's
 * lifetime, so every case uses a host of its own rather than a shared reset.
 */
function answer(status: number, options: { retryAfter?: string; cancel?: () => Promise<void>; text?: () => Promise<string> } = {}): Response {
  return {
    ok: status < 300,
    status,
    headers: { get: (name: string) => (name === 'Retry-After' ? options.retryAfter ?? null : null) },
    body: { cancel: options.cancel ?? (async () => {}) },
    text: options.text ?? (async () => 'page'),
  } as unknown as Response
}

let paced = 0
const throttle: Throttle = {
  async next() {
    paced += 1
  },
}

const read = async (response: Response): Promise<string> => response.text()
let sentAt: number[] = []

function replyWith(...responses: (() => Response | Promise<Response>)[]): void {
  let index = 0
  vi.stubGlobal('fetch', vi.fn(async () => {
    sentAt.push(Date.now())
    const next = responses[Math.min(index, responses.length - 1)]
    index += 1
    return await next()
  }))
}

async function failed(run: Promise<unknown>): Promise<RequestError> {
  try {
    await run
  } catch (error) {
    return error as RequestError
  }
  throw new Error('the request was expected to fail')
}

beforeEach(() => {
  vi.useFakeTimers()
  paced = 0
  sentAt = []
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('request recovery', () => {
  it('sends a working request once, through the pace, and leaves no timer behind', async () => {
    replyWith(() => answer(200))
    const result = await request('https://ok.invalid/s', {}, throttle, read)
    expect(result).toEqual({ data: 'page', attempts: 1 })
    expect(paced).toBe(1)
    expect(sentAt).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('recovers from a 503 on the next attempt, one second later and paced again', async () => {
    replyWith(() => answer(503), () => answer(200))
    const run = request('https://flaky.invalid/s', {}, throttle, read)
    await vi.advanceTimersByTimeAsync(5000)
    const result = await run
    expect(result.attempts).toBe(2)
    expect(sentAt[1] - sentAt[0]).toBe(1000)
    expect(paced).toBe(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('gives up after three attempts, backing off further each time', async () => {
    replyWith(() => answer(500))
    const run = failed(request('https://down.invalid/s', {}, throttle, read))
    await vi.advanceTimersByTimeAsync(20000)
    const error = await run
    expect(error).toBeInstanceOf(RequestError)
    expect(error.kind).toBe('http')
    expect(error.attempts).toBe(3)
    expect(sentAt).toHaveLength(3)
    expect(sentAt[1] - sentAt[0]).toBe(1000)
    expect(sentAt[2] - sentAt[1]).toBe(2000)
  })

  it('does not repeat a restricted answer, drops its body, and stops the run', async () => {
    const cancel = vi.fn(async () => {})
    replyWith(() => answer(403, { cancel }))
    const error = await failed(request('https://banned.invalid/s', {}, throttle, read))
    expect(error.kind).toBe('http')
    expect(error.status).toBe(403)
    expect(error.attempts).toBe(1)
    expect(sentAt).toHaveLength(1)
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(stopsRequests(error)).toBe(true)
  })

  it('keeps a known HTTP restriction even when cancelling its body never settles', async () => {
    replyWith(() => answer(429, { cancel: () => new Promise<void>(() => {}) }))
    const error = await failed(request('https://cancel-stalls.invalid/s', {}, throttle, read))
    expect(error.status).toBe(429)
    expect(error.attempts).toBe(1)
    expect(sentAt).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('waits the Retry-After the host asked for instead of its own backoff', async () => {
    replyWith(() => answer(503, { retryAfter: '5' }), () => answer(200))
    const run = request('https://asks.invalid/s', {}, throttle, read)
    await vi.advanceTimersByTimeAsync(10000)
    const result = await run
    expect(result.attempts).toBe(2)
    expect(sentAt[1] - sentAt[0]).toBe(5000)
  })

  it('stops the run for a Retry-After past the deadline and holds the origin off afterwards', async () => {
    replyWith(() => answer(429, { retryAfter: '60' }))
    const error = await failed(request('https://cools.invalid/s', {}, throttle, read))
    expect(error.attempts).toBe(1)
    expect(error.retryAt).toBe(Date.now() + 60000)
    expect(stopsRequests(error)).toBe(true)

    const again = await failed(request('https://cools.invalid/other', {}, throttle, read))
    expect(again.attempts).toBe(0)
    expect(sentAt).toHaveLength(1)
    expect(paced).toBe(1)
    expect(stopsRequests(again)).toBe(true)
  })

  it('leaves a body that never finishes at the deadline, and still stops at three attempts', async () => {
    replyWith(() => answer(200, { text: () => new Promise<string>(() => {}) }))
    const run = failed(request('https://stalls.invalid/s', {}, throttle, read))
    await vi.advanceTimersByTimeAsync(200000)
    const error = await run
    expect(error.kind).toBe('timeout')
    expect(error.attempts).toBe(3)
    expect(sentAt).toHaveLength(3)
    expect(sentAt[1] - sentAt[0]).toBe(30000 + 1000)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('aborts attempts whose headers never arrive', async () => {
    const signals: AbortSignal[] = []
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => {
      signals.push(init.signal as AbortSignal)
      return new Promise<Response>(() => {})
    }))
    const run = failed(request('https://no-headers.invalid/s', {}, throttle, read))
    await vi.advanceTimersByTimeAsync(100000)
    expect(await run).toMatchObject({ kind: 'timeout', attempts: 3 })
    expect(signals.map((signal) => signal.aborted)).toEqual([true, true, true])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not repeat a body the caller rejected as not the protocol', async () => {
    replyWith(() => answer(200))
    const reject = async (): Promise<string> => {
      throw new RequestError('invalid-response', 'not a search page')
    }
    const error = await failed(request('https://wrong.invalid/s', {}, throttle, reject))
    expect(error.kind).toBe('invalid-response')
    expect(error.attempts).toBe(1)
    expect(sentAt).toHaveLength(1)
    expect(stopsRequests(error)).toBe(true)
  })

  it('repeats a connection that never landed', async () => {
    replyWith(
      () => {
        throw new TypeError('Failed to fetch')
      },
      () => answer(200),
    )
    const run = request('https://offline.invalid/s', {}, throttle, read)
    await vi.advanceTimersByTimeAsync(5000)
    expect((await run).attempts).toBe(2)
  })

  it('recovers from a network error created in another realm', async () => {
    replyWith(
      () => { throw runInNewContext('new TypeError("Failed to fetch")') },
      () => answer(200),
    )
    const run = request('https://other-realm.invalid/s', {}, throttle, read).catch((error) => error)
    await vi.advanceTimersByTimeAsync(5000)
    expect(await run).toEqual({ data: 'page', attempts: 2 })
  })

  it('repeats a body the connection cut short', async () => {
    replyWith(
      () => answer(200, {
        text: async () => {
          throw new TypeError('terminated')
        },
      }),
      () => answer(200),
    )
    const run = request('https://cut.invalid/s', {}, throttle, read)
    await vi.advanceTimersByTimeAsync(5000)
    expect((await run).attempts).toBe(2)
  })

  it('lets a broken parser surface as itself rather than as three requests', async () => {
    replyWith(() => answer(200))
    const broken = async (response: Response): Promise<string> => {
      await response.text()
      throw new TypeError('rows.map is not a function')
    }
    let error: unknown
    try {
      await request('https://parser.invalid/s', {}, throttle, broken)
    } catch (thrown) {
      error = thrown
    }
    expect(error).toBeInstanceOf(TypeError)
    expect(error).not.toBeInstanceOf(RequestError)
    expect(sentAt).toHaveLength(1)
  })
})
