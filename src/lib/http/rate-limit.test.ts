import { describe, expect, it } from 'vitest'
import { createRateLimiter } from './rate-limit'

describe('createRateLimiter', () => {
  it('allows `limit` requests and then answers 429 data', () => {
    const take = createRateLimiter({ limit: 3, windowMs: 60_000 })
    const now = 1_000_000

    expect(take('ip', now).allowed).toBe(true)
    expect(take('ip', now).allowed).toBe(true)
    expect(take('ip', now).allowed).toBe(true)

    const blocked = take('ip', now)

    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1)
  })

  it('refills over the window', () => {
    const take = createRateLimiter({ limit: 2, windowMs: 60_000 })

    take('ip', 0)
    take('ip', 0)
    expect(take('ip', 0).allowed).toBe(false)
    expect(take('ip', 30_000).allowed).toBe(true)
    expect(take('ip', 60_000).allowed).toBe(true)
  })

  it('keeps independent buckets per key', () => {
    const take = createRateLimiter({ limit: 1, windowMs: 60_000 })

    expect(take('a', 0).allowed).toBe(true)
    expect(take('a', 0).allowed).toBe(false)
    expect(take('b', 0).allowed).toBe(true)
  })

  it('does not grow without bound when many keys appear', () => {
    const take = createRateLimiter({ limit: 1, windowMs: 60_000, maxEntries: 10 })

    for (let index = 0; index < 10; index++) {
      take(`ip-${index}`, 0)
    }

    // Al superar maxEntries se limpian las vencidas; el limiter sigue operando.
    expect(take('ip-new', 120_000).allowed).toBe(true)
  })
})
