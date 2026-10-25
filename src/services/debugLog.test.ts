import { describe, expect, it } from 'vitest'
import { logKeyTime } from './debugLog'

describe('logKeyTime', () => {
  // The write time rides in the key, so old entries are found by listing keys alone.
  it('reads the write time out of a log key', () => {
    expect(logKeyTime('ehl_log_1700000000000_abc123')).toBe(1700000000000)
  })

  it('reads no time from a key written another way', () => {
    expect(logKeyTime('ehl_log_x')).toBeNaN()
  })
})
