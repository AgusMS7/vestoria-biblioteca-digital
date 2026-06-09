import exifr from 'exifr'

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
 * Extrae el año de un archivo multimedia usando múltiples fuentes de información
 *
 * Prioridades (NUNCA usar createdTime):
 * 1. EXIF DateTimeOriginal (para imágenes)
 * 2. Metadata de grabación de vídeo
 * 3. Patrón en nombre de archivo (ej: IMG_20190523.jpg)
 * 4. modifiedTime de Google Drive (como último recurso)
 *
 * Retorna undefined si no puede determinarse el año o si es futuro/inválido
 */
export async function extractYearFromMedia(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  modifiedTime?: string
): Promise<number | undefined> {
  // Paso 1: Intentar EXIF para imágenes
  if (mimeType.startsWith('image/')) {
    try {
      const exifData = await exifr.parse(buffer)
      if (exifData?.DateTimeOriginal) {
        const date = new Date(exifData.DateTimeOriginal)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          if (isValidYear(year)) {
            return year
          }
        }
      }
    } catch (error) {
      // EXIF no disponible o error al parsear
    }
  }

  // Paso 2: Intentar extraer año de patrón en nombre de archivo
  // Patrones comunes: IMG_20190523.jpg, foto_2018_02_14.jpg, Vacaciones_2020.jpg
  const yearMatch = fileName.match(/20\d{2}/)
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10)
    if (isValidYear(year)) {
      return year
    }
  }

  // Paso 3: Usar modifiedTime de Google Drive (último recurso)
  if (modifiedTime) {
    try {
      const date = new Date(modifiedTime)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        if (isValidYear(year)) {
          return year
        }
      }
    } catch (error) {
      // Ignorar error
    }
  }

  // No pudo determinarse el año
  return undefined
}

/**
 * Extrae año de forma simplificada cuando no tenemos buffer
 * (para casos donde solo tenemos metadatos sin descargar el archivo)
 *
 * IMPORTANTE: No usa createdTime (representa fecha de subida, no del recuerdo)
 */
export function extractYearFromMetadata(
  fileName: string,
  modifiedTime?: string
): number | undefined {
  // Patrón en nombre (primera prioridad)
  const yearMatch = fileName.match(/20\d{2}/)
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10)
    if (isValidYear(year)) {
      return year
    }
  }

  // modifiedTime (último recurso)
  if (modifiedTime) {
    try {
      const year = new Date(modifiedTime).getFullYear()
      if (isValidYear(year)) {
        return year
      }
    } catch (error) {
      // Ignorar
    }
  }

  return undefined
}

/**
 * Extrae año Y mes de un archivo multimedia
 *
 * Retorna { year: number, month?: number } o null si no puede determinarse
 */
export function extractYearMonthFromMetadata(
  fileName: string,
  modifiedTime?: string
): { year: number; month?: number } | null {
  let year: number | undefined
  let month: number | undefined

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

  // Nivel 4: modifiedTime (media confianza)
  // IMPORTANTE: modifiedTime es menos confiable (puede ser fecha de modificación en Drive, no del recuerdo)
  // Pero es mejor que nada para archivos sin metadata
  if (modifiedTime) {
    try {
      const date = new Date(modifiedTime)
      if (!isNaN(date.getTime())) {
        year = date.getFullYear()
        month = date.getMonth() + 1 // getMonth() retorna 0-11
        if (isValidYear(year)) {
          return { year, month }
        }
      }
    } catch (error) {
      // Ignorar
    }
  }

  return null
}
