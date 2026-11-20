import { describe, expect, it } from 'vitest'
import { extractDateTimeOriginal } from './exif'

/**
 * Construye un JPEG mínimo (SOI + APP1/Exif + EOI) con el `DateTimeOriginal`
 * indicado. Sin SOF ni SOS: al parser solo le interesan los metadatos.
 */
function buildJpegWithExif(
  dateTimeOriginal: string,
  littleEndian = true
): Buffer {
  const tiff = Buffer.alloc(64)
  const writeU16 = (value: number, at: number) =>
    littleEndian ? tiff.writeUInt16LE(value, at) : tiff.writeUInt16BE(value, at)
  const writeU32 = (value: number, at: number) =>
    littleEndian ? tiff.writeUInt32LE(value, at) : tiff.writeUInt32BE(value, at)

  // Cabecera TIFF
  tiff.write(littleEndian ? 'II' : 'MM', 0, 'ascii')
  writeU16(42, 2)
  writeU32(8, 4) // IFD0

  // IFD0 con un único tag: puntero al Exif IFD
  writeU16(1, 8)
  writeU16(0x8769, 10)
  writeU16(4, 12) // LONG
  writeU32(1, 14)
  writeU32(26, 18)
  writeU32(0, 22)

  // Exif IFD con DateTimeOriginal
  writeU16(1, 26)
  writeU16(0x9003, 28)
  writeU16(2, 30) // ASCII
  writeU32(20, 32)
  writeU32(44, 36)
  writeU32(0, 40)

  tiff.write(`${dateTimeOriginal}\0`, 44, 'ascii')

  const app1 = Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), tiff])
  const length = Buffer.alloc(2)
  length.writeUInt16BE(app1.length + 2, 0)

  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from([0xff, 0xe1]),
    length,
    app1,
    Buffer.from([0xff, 0xd9]),
  ])
}

describe('extractDateTimeOriginal', () => {
  it('reads DateTimeOriginal from a little-endian APP1 segment', () => {
    const buffer = buildJpegWithExif('2019:07:15 12:34:56')

    expect(extractDateTimeOriginal(buffer)).toEqual({ year: 2019, month: 7 })
  })

  it('reads a big-endian TIFF header', () => {
    const buffer = buildJpegWithExif('2021:11:02 08:00:00', false)

    expect(extractDateTimeOriginal(buffer)).toEqual({ year: 2021, month: 11 })
  })

  it('rejects dates outside the plausible range', () => {
    expect(
      extractDateTimeOriginal(buildJpegWithExif('1899:12:31 23:59:59'))
    ).toBeNull()
    expect(
      extractDateTimeOriginal(buildJpegWithExif('2999:01:01 00:00:00'))
    ).toBeNull()
  })

  it('returns null for non-jpeg or truncated input', () => {
    expect(extractDateTimeOriginal(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBeNull()
    expect(extractDateTimeOriginal(Buffer.alloc(0))).toBeNull()

    const truncated = buildJpegWithExif('2019:07:15 12:34:56').subarray(0, 40)

    expect(extractDateTimeOriginal(truncated)).toBeNull()
  })
})
