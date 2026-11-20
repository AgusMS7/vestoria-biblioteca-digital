/**
 * Parser mínimo de EXIF para JPEG.
 *
 * Solo extrae `DateTimeOriginal` (tag 0x9003) del primer segmento APP1, que es
 * lo único que necesita el agrupado cronológico. No usa dependencias externas.
 */

export interface ExifDate {
  year: number
  month?: number
}

const EXIF_IFD_POINTER = 0x8769
const DATE_TIME_ORIGINAL = 0x9003

export function extractDateTimeOriginal(buffer: Buffer): ExifDate | null {
  // JPEG: SOI (0xFFD8)
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null
  }

  let offset = 2

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      // Sin marcador válido no se puede seguir el recorrido de segmentos.
      return null
    }

    const marker = buffer[offset + 1]

    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2
      continue
    }

    if (marker === 0xda) {
      // Inicio de los datos de imagen: no hay más metadatos.
      break
    }

    const segmentLength = buffer.readUInt16BE(offset + 2)

    if (segmentLength < 2) {
      return null
    }

    const segmentStart = offset + 4
    const segmentEnd = offset + 2 + segmentLength

    if (segmentEnd > buffer.length) {
      return null
    }

    if (marker === 0xe1) {
      const segment = buffer.subarray(segmentStart, segmentEnd)

      if (
        segment.length > 6 &&
        segment.toString('ascii', 0, 4) === 'Exif' &&
        segment[4] === 0 &&
        segment[5] === 0
      ) {
        return parseTiff(segment.subarray(6))
      }
    }

    offset = segmentEnd
  }

  return null
}

function parseTiff(tiff: Buffer): ExifDate | null {
  if (tiff.length < 8) {
    return null
  }

  const order = tiff.toString('ascii', 0, 2)

  if (order !== 'II' && order !== 'MM') {
    return null
  }

  const littleEndian = order === 'II'
  const readU16 = (at: number) =>
    littleEndian ? tiff.readUInt16LE(at) : tiff.readUInt16BE(at)
  const readU32 = (at: number) =>
    littleEndian ? tiff.readUInt32LE(at) : tiff.readUInt32BE(at)

  if (readU16(2) !== 42) {
    return null
  }

  const ifd0Offset = readU32(4)
  const exifIfdOffset = findTagValue(tiff, ifd0Offset, EXIF_IFD_POINTER, readU16, readU32)

  if (exifIfdOffset === null) {
    return null
  }

  const dateOffset = findTagValue(tiff, exifIfdOffset, DATE_TIME_ORIGINAL, readU16, readU32)

  if (dateOffset === null || dateOffset + 19 > tiff.length) {
    return null
  }

  const raw = tiff.toString('ascii', dateOffset, dateOffset + 19)
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(raw)

  if (!match) {
    return null
  }

  const year = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10)

  if (!isValidYear(year) || month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

function findTagValue(
  tiff: Buffer,
  ifdOffset: number,
  tag: number,
  readU16: (at: number) => number,
  readU32: (at: number) => number
): number | null {
  if (ifdOffset + 2 > tiff.length) {
    return null
  }

  const entryCount = readU16(ifdOffset)

  if (entryCount === 0 || entryCount > 1000) {
    return null
  }

  for (let index = 0; index < entryCount; index++) {
    const entryOffset = ifdOffset + 2 + index * 12

    if (entryOffset + 12 > tiff.length) {
      return null
    }

    if (readU16(entryOffset) === tag) {
      return readU32(entryOffset + 8)
    }
  }

  return null
}

function isValidYear(year: number): boolean {
  return year >= 1990 && year <= new Date().getFullYear()
}
