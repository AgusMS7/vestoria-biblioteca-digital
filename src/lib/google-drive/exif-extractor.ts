import exifr from 'exifr'

interface ExifDateInfo {
  source: 'exif_datetimeoriginal' | 'exif_createdate' | 'exif_datetime'
  year: number
  month?: number
  day?: number
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Intenta extraer fecha EXIF real desde un buffer de imagen
 * Esta función requiere que el archivo ya esté descargado
 */
export async function extractExifDate(buffer: Buffer, mimeType: string): Promise<ExifDateInfo | null> {
  // Solo intentar para imágenes
  if (!mimeType.startsWith('image/')) {
    return null
  }

  try {
    const exifData = await exifr.parse(buffer, true)

    if (!exifData) {
      return null
    }

    // Prioridad 1: DateTimeOriginal (fecha de captura original)
    if (exifData.DateTimeOriginal) {
      const date = new Date(exifData.DateTimeOriginal)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        // Validar año
        if (year >= 1990 && year <= new Date().getFullYear()) {
          return {
            source: 'exif_datetimeoriginal',
            year,
            month,
            day,
            confidence: 'high',
          }
        }
      }
    }

    // Prioridad 2: CreateDate (fecha de creación del archivo)
    if (exifData.CreateDate) {
      const date = new Date(exifData.CreateDate)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        // Validar año
        if (year >= 1990 && year <= new Date().getFullYear()) {
          return {
            source: 'exif_createdate',
            year,
            month,
            day,
            confidence: 'high',
          }
        }
      }
    }

    // Prioridad 3: DateTime genérico
    if (exifData.DateTime) {
      const date = new Date(exifData.DateTime)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        // Validar año
        if (year >= 1990 && year <= new Date().getFullYear()) {
          return {
            source: 'exif_datetime',
            year,
            month,
            day,
            confidence: 'medium',
          }
        }
      }
    }

    return null
  } catch (error) {
    // EXIF parsing failed, return null
    return null
  }
}

/**
 * Cache en memoria para EXIF extraído
 * Evita re-extraer EXIF del mismo archivo múltiples veces
 */
const exifCache = new Map<string, ExifDateInfo | null>()

/**
 * Obtiene EXIF con caché
 */
export async function getExifDateCached(
  buffer: Buffer,
  mimeType: string,
  fileId: string
): Promise<ExifDateInfo | null> {
  const cacheKey = fileId

  if (exifCache.has(cacheKey)) {
    return exifCache.get(cacheKey) || null
  }

  const result = await extractExifDate(buffer, mimeType)
  exifCache.set(cacheKey, result)

  // Limpiar caché si crece demasiado (máximo 100 entradas)
  if (exifCache.size > 100) {
    const firstKey = exifCache.keys().next().value
    if (firstKey) exifCache.delete(firstKey)
  }

  return result
}

/**
 * Limpiar caché de EXIF (útil para testing o refresh)
 */
export function clearExifCache(): void {
  exifCache.clear()
}

/**
 * Obtener estadísticas del caché
 */
export function getExifCacheStats(): { size: number; keys: string[] } {
  return {
    size: exifCache.size,
    keys: Array.from(exifCache.keys()),
  }
}
