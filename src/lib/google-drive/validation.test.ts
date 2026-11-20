import { describe, expect, it } from 'vitest'
import { isValidDriveId } from './validation'

describe('isValidDriveId', () => {
  it('accepts drive ids (base64url-ish, at least 10 chars)', () => {
    expect(isValidDriveId('1AbCdEfGhIjKlMnOpQrStUv')).toBe(true)
    expect(isValidDriveId('_a-b_C-d_E')).toBe(true)
  })

  it('rejects short or malformed ids', () => {
    expect(isValidDriveId('short')).toBe(false)
    expect(isValidDriveId('')).toBe(false)
    expect(isValidDriveId('has spaces in it')).toBe(false)
    expect(isValidDriveId('path/traversal/../x')).toBe(false)
  })
})
