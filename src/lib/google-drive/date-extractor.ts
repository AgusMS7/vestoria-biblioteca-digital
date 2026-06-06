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
 * Prioridades:
 * 1. EXIF DateTimeOriginal (para imágenes)
 * 2. Metadata de grabación de vídeo
 * 3. Patrón en nombre de archivo (ej: IMG_20190523.jpg)
 * 4. createdTime de Google Drive
 * 5. modifiedTime de Google Drive
 *
 * Retorna undefined si no puede determinarse el año o si es futuro/inválido
 */
export async function extractYearFromMedia(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  createdTime?: string,
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

  // Paso 3: Usar createdTime de Google Drive
  if (createdTime) {
    try {
      const date = new Date(createdTime)
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

  // Paso 4: Usar modifiedTime de Google Drive
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
 */
export function extractYearFromMetadata(
  fileName: string,
  createdTime?: string,
  modifiedTime?: string
): number | undefined {
  // Patrón en nombre
  const yearMatch = fileName.match(/20\d{2}/)
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10)
    if (isValidYear(year)) {
      return year
    }
  }

  // createdTime
  if (createdTime) {
    try {
      const year = new Date(createdTime).getFullYear()
      if (isValidYear(year)) {
        return year
      }
    } catch (error) {
      // Ignorar
    }
  }

  // modifiedTime
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
