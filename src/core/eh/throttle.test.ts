import { describe, expect, it, vi } from 'vitest'
import { createThrottle } from './throttle'

describe('request pace', () => {
  it('lets the first request go at once and spaces the rest', async () => {
    vi.useFakeTimers()
    const throttle = createThrottle({ intervalMs: 1000 })
    const at: number[] = []
    const run = (async () => {
      for (let i = 0; i < 3; i += 1) {
        await throttle.next()
        at.push(Date.now())
      }
    })()
    await vi.advanceTimersByTimeAsync(5000)
    await run
    expect(at[1] - at[0]).toBe(1000)
    expect(at[2] - at[1]).toBe(1000)
    vi.useRealTimers()
  })

  it('waits only for the time still owed, so a gap already spent costs nothing', async () => {
    vi.useFakeTimers()
    const throttle = createThrottle({ intervalMs: 1000 })
    await throttle.next()
    // a cached response, or just slow parsing, used up the interval already
    await vi.advanceTimersByTimeAsync(1500)
    const before = Date.now()
    const run = throttle.next()
    await vi.advanceTimersByTimeAsync(0)
    await run
    expect(Date.now() - before).toBe(0)
    vi.useRealTimers()
  })
})
