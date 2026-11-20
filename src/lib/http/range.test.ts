import { describe, expect, it } from 'vitest'
import { parseRangeHeader } from './range'

describe('parseRangeHeader', () => {
  it('parses a closed range', () => {
    expect(parseRangeHeader('bytes=0-499', 1000)).toEqual({
      start: 0,
      end: 499,
    })
  })

  it('parses an open-ended range', () => {
    expect(parseRangeHeader('bytes=500-', 1000)).toEqual({
      start: 500,
      end: 999,
    })
  })

  it('parses a suffix range', () => {
    expect(parseRangeHeader('bytes=-200', 1000)).toEqual({
      start: 800,
      end: 999,
    })
    expect(parseRangeHeader('bytes=-5000', 1000)).toEqual({
      start: 0,
      end: 999,
    })
  })

  it('clamps an end beyond the file size', () => {
    expect(parseRangeHeader('bytes=900-5000', 1000)).toEqual({
      start: 900,
      end: 999,
    })
  })

  it('trims surrounding whitespace', () => {
    expect(parseRangeHeader(' bytes=10-20 ', 1000)).toEqual({
      start: 10,
      end: 20,
    })
  })

  it('rejects malformed, multi-range or out-of-bounds requests', () => {
    expect(parseRangeHeader('bytes=0-10,20-30', 1000)).toBeNull()
    expect(parseRangeHeader('items=0-10', 1000)).toBeNull()
    expect(parseRangeHeader('bytes=-', 1000)).toBeNull()
    expect(parseRangeHeader('bytes=1000-', 1000)).toBeNull()
    expect(parseRangeHeader('bytes=20-10', 1000)).toBeNull()
    expect(parseRangeHeader('bytes=0-10', 0)).toBeNull()
  })
})
