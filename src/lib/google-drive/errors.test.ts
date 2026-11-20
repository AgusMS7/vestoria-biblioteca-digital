import { describe, expect, it } from 'vitest'
import {
  DriveNotFoundError,
  getDriveErrorStatus,
  isDriveNotFoundError,
  rethrowDriveError,
} from './errors'

describe('getDriveErrorStatus', () => {
  it('reads the response status first, then code', () => {
    expect(getDriveErrorStatus({ response: { status: 404 } })).toBe(404)
    expect(getDriveErrorStatus({ code: 403 })).toBe(403)
    expect(getDriveErrorStatus({ code: 'ENOENT' })).toBeUndefined()
    expect(getDriveErrorStatus(null)).toBeUndefined()
    expect(getDriveErrorStatus(new Error('x'))).toBeUndefined()
  })
})

describe('isDriveNotFoundError', () => {
  it('recognises the domain error and drive 404s', () => {
    expect(isDriveNotFoundError(new DriveNotFoundError())).toBe(true)
    expect(isDriveNotFoundError({ response: { status: 404 } })).toBe(true)
    expect(isDriveNotFoundError({ code: 404 })).toBe(true)
  })

  it('does not treat other errors as 404', () => {
    expect(isDriveNotFoundError({ response: { status: 500 } })).toBe(false)
    expect(isDriveNotFoundError(new Error('network'))).toBe(false)
    expect(isDriveNotFoundError(undefined)).toBe(false)
  })
})

describe('rethrowDriveError', () => {
  it('converts a drive 404 into the domain error', () => {
    expect(() => rethrowDriveError({ response: { status: 404 } })).toThrow(
      DriveNotFoundError
    )
  })

  it('rethrows anything else untouched', () => {
    const original = new Error('boom')

    try {
      rethrowDriveError(original)
      expect.unreachable()
    } catch (error) {
      expect(error).toBe(original)
    }
  })
})
