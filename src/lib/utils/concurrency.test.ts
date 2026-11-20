import { describe, expect, it } from 'vitest'
import { mapWithConcurrency } from './concurrency'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('mapWithConcurrency', () => {
  it('keeps the order of the results', async () => {
    const result = await mapWithConcurrency([3, 1, 2], 2, async (n) => {
      await delay(n)
      return n * 10
    })

    expect(result).toEqual([30, 10, 20])
  })

  it('never runs more than `limit` tasks at once', async () => {
    let inFlight = 0
    let peak = 0

    await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (n) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await delay(5)
      inFlight -= 1
      return n
    })

    expect(peak).toBeLessThanOrEqual(2)
  })

  it('handles an empty list and a limit larger than the list', async () => {
    expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([])
    expect(await mapWithConcurrency([1, 2], 10, async (n) => n)).toEqual([1, 2])
  })

  it('rejects when a task fails', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) {
          throw new Error('boom')
        }

        return n
      })
    ).rejects.toThrow('boom')
  })
})
