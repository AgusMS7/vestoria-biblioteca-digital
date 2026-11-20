import { describe, expect, it } from 'vitest'
import {
  extractYearMonthFromMetadata,
  extractYearMonthFromName,
} from './date-extractor'

describe('extractYearMonthFromName', () => {
  it('reads camera prefixes (IMG, PXL, DSC, DCIM)', () => {
    expect(extractYearMonthFromName('IMG_20190715_123456.jpg')).toEqual({
      year: 2019,
      month: 7,
    })
    expect(extractYearMonthFromName('PXL-2020-12-24-1.jpg')).toEqual({
      year: 2020,
      month: 12,
    })
  })

  it('reads yyyy-mm-dd and yyyy_mm_dd', () => {
    expect(extractYearMonthFromName('2019-07-15 cumple.jpg')).toEqual({
      year: 2019,
      month: 7,
    })
    expect(extractYearMonthFromName('fotos_2021_11_02')).toEqual({
      year: 2021,
      month: 11,
    })
  })

  it('reads a bare year between separators', () => {
    expect(extractYearMonthFromName('verano (1999).jpg')).toEqual({
      year: 1999,
    })
  })

  it('ignores numbers that look like a date inside a long id', () => {
    expect(
      extractYearMonthFromName('IMG_1654090_10153892063535725_1771742050_n.jpg')
    ).toBeNull()
  })

  it('keeps the year but drops an impossible month', () => {
    expect(extractYearMonthFromName('2019-13-15.jpg')).toEqual({ year: 2019 })
  })

  it('keeps the year when the day is followed by an extension', () => {
    expect(extractYearMonthFromName('2019-07-15.jpg')).toEqual({ year: 2019 })
  })
})

describe('extractYearMonthFromMetadata', () => {
  it('prefers the name over modifiedTime', () => {
    expect(
      extractYearMonthFromMetadata('2019-07-15 cumple.jpg', '2010-01-01T12:00:00Z')
    ).toEqual({ year: 2019, month: 7 })
  })

  it('falls back to modifiedTime when the name has no date', () => {
    expect(
      extractYearMonthFromMetadata('foto.jpg', '2015-03-09T12:00:00Z')
    ).toEqual({ year: 2015, month: 3 })
  })

  it('ignores an invalid year in the name and uses modifiedTime', () => {
    expect(
      extractYearMonthFromMetadata('2999-01-02.jpg', '2020-05-05T12:00:00Z')
    ).toEqual({ year: 2020, month: 5 })
  })

  it('returns null without a usable date', () => {
    expect(extractYearMonthFromMetadata('foto.jpg')).toBeNull()
    expect(extractYearMonthFromMetadata('foto.jpg', 'not-a-date')).toBeNull()
  })
})
