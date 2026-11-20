export interface Range {
  start: number
  end: number
}

/**
 * Interpreta `Range: bytes=...` para un archivo de `totalSize` bytes.
 * Solo soporta un rango simple; devuelve null si es inválido o fuera de rango.
 */
export function parseRangeHeader(
  rangeHeader: string,
  totalSize: number
): Range | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())

  if (!match || totalSize <= 0) {
    return null
  }

  const [, startText, endText] = match

  if (!startText && !endText) {
    return null
  }

  if (!startText) {
    const suffixLength = Number.parseInt(endText, 10)

    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null
    }

    const start = Math.max(totalSize - suffixLength, 0)

    return { start, end: totalSize - 1 }
  }

  const start = Number.parseInt(startText, 10)

  if (!Number.isFinite(start) || start < 0 || start >= totalSize) {
    return null
  }

  const requestedEnd = endText ? Number.parseInt(endText, 10) : totalSize - 1

  if (!Number.isFinite(requestedEnd) || requestedEnd < start) {
    return null
  }

  return {
    start,
    end: Math.min(requestedEnd, totalSize - 1),
  }
}
