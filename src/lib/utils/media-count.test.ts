import { describe, expect, it } from 'vitest'
import { formatMediaCount } from './media-count'

describe('formatMediaCount', () => {
  it('keeps the historical label when there are no videos', () => {
    expect(formatMediaCount(9, 0)).toBe('9 fotos')
    expect(formatMediaCount(1, 0)).toBe('1 foto')
    expect(formatMediaCount(0, 0)).toBe('0 fotos')
  })

  it('breaks the count down when there are videos', () => {
    expect(formatMediaCount(8, 1)).toBe('8 fotos · 1 video')
    expect(formatMediaCount(0, 2)).toBe('0 fotos · 2 videos')
    expect(formatMediaCount(31, 3)).toBe('31 fotos · 3 videos')
  })
})
