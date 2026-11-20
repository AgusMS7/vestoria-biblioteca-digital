/**
 * Obtiene el año actual
 */
function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Valida que un año sea razonable y no futuro
 */
function isValidYear(year: number): boolean {
  const currentYear = getCurrentYear()
  // Año debe estar entre 1990 y el año actual (no futuro)
  return year >= 1990 && year <= currentYear
}

/**
 * Extrae año Y mes de un nombre de archivo.
 *
 * Retorna { year: number, month?: number } o null si el nombre no trae fecha.
 * Solo considera patrones de alta confianza; no mira metadatos de Drive.
 */
export function extractYearMonthFromName(
  fileName: string
): { year: number; month?: number } | null {
  // Nivel 3: Fecha válida en nombre (MÁXIMA CONFIANZA en patrones claros)
  // Patrones específicos que indicán fecha real:
  // - IMG_YYYYMMDD (cámaras estándar)
  // - PXL_YYYYMMDD (Google Pixel)
  // - DSC_YYYYMMDD (Sony/Nikon)
  // - DCIM_YYYYMMDD (DCIM folders)
  // - YYYY-MM-DD, YYYY_MM_DD, YYYYMMDD (claros)

  // 3.1: Patrones estrictos de cámara (IMG, PXL, DSC, DCIM)
  const cameraDateMatch = fileName.match(/(?:IMG|PXL|DSC|DCIM)[_-]?(\d{4})[_-]?(\d{2})[_-]?(\d{2})/i)
  if (cameraDateMatch) {
    const y = parseInt(cameraDateMatch[1], 10)
    const m = parseInt(cameraDateMatch[2], 10)
    // Validar mes
    if (isValidYear(y) && m >= 1 && m <= 12) {
      // Validar día (básico)
      const d = parseInt(cameraDateMatch[3], 10)
      if (d >= 1 && d <= 31) {
        return { year: y, month: m }
      }
    }
  }

  // 3.2: Patrón claro YYYY-MM-DD o YYYY_MM_DD o YYYYMMDD aislado
  // IMPORTANTE: Debe estar rodeado de separadores o límites, NO en el medio de números
  const isoDateMatch = fileName.match(/(^|[-_\s])(\d{4})[-_](\d{2})[-_](\d{2})([-_\s]|$)/)
  if (isoDateMatch) {
    const y = parseInt(isoDateMatch[2], 10)
    const m = parseInt(isoDateMatch[3], 10)
    const d = parseInt(isoDateMatch[4], 10)
    if (isValidYear(y) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m }
    }
  }

  // 3.3: Año aislado (1900-2999)
  // IMPORTANTE: Debe estar rodeado de separadores, NO en secuencia de números arbitrarios
  // Evita matches como 1654090_10153892063535725_1771742050_n.jpg → 6540
  const isoYearMatch = fileName.match(/(^|[-_\s()])([1-2]\d{3})([-_\s()]|$)/)
  if (isoYearMatch) {
    const y = parseInt(isoYearMatch[2], 10)
    if (isValidYear(y)) {
      return { year: y }
    }
  }

  return null
}

/**
 * Extrae año Y mes de un archivo multimedia.
 *
 * Prioridad: patrón en el nombre → `modifiedTime` de Drive.
 * `createdTime` se evita a propósito.
 */
export function extractYearMonthFromMetadata(
  fileName: string,
  modifiedTime?: string
): { year: number; month?: number } | null {
  const fromName = extractYearMonthFromName(fileName)

  if (fromName) {
    return fromName
  }

  // Nivel 4: modifiedTime (media confianza)
  // IMPORTANTE: modifiedTime es menos confiable (puede ser fecha de modificación en Drive, no del recuerdo)
  // Pero es mejor que nada para archivos sin metadata
  if (modifiedTime) {
    try {
      const date = new Date(modifiedTime)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = date.getMonth() + 1 // getMonth() retorna 0-11
        if (isValidYear(year)) {
          return { year, month }
        }
      }
    } catch {
      // Ignorar
    }
  }

  return null
}
