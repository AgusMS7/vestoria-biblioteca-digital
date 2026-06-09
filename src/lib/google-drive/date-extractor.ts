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

  // Intenta extraer fecha completa del nombre: YYYYMMDD o similar
  // Patrones: 20190523, 2019-05-23, 2019_05_23
  const fullDateMatch = fileName.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/)
  if (fullDateMatch) {
    const y = parseInt(fullDateMatch[1], 10)
    const m = parseInt(fullDateMatch[2], 10)
    if (isValidYear(y) && m >= 1 && m <= 12) {
      return { year: y, month: m }
    }
  }

  // Intenta extraer solo año del nombre
  // Patrones más flexible: puede estar en cualquier lugar, no necesariamente 20XX
  const yearMatch = fileName.match(/19\d{2}|20\d{2}/)
  if (yearMatch) {
    year = parseInt(yearMatch[0], 10)
    if (isValidYear(year)) {
      return { year }
    }
  }

  // Intenta patrones comunes de cámara: IMG_YYYYMMDD, DCIM_YYYYMMDD, etc
  const cameraDateMatch = fileName.match(/IMG[_-]?(\d{4})[_-]?(\d{2})[_-]?(\d{2})/i)
  if (cameraDateMatch) {
    const y = parseInt(cameraDateMatch[1], 10)
    const m = parseInt(cameraDateMatch[2], 10)
    if (isValidYear(y) && m >= 1 && m <= 12) {
      return { year: y, month: m }
    }
  }

  // Usa modifiedTime como último recurso (incluye mes si está disponible)
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
