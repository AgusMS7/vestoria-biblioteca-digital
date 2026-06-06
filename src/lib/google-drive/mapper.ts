import type { Album } from '@/types/album'
import { extractYearFromMetadata } from './date-extractor'
import type { Media } from '@/types/media'
import type { Category } from '@/types/category'

/**
 * Transforma un archivo de Google Drive en nuestro modelo de Media
 */
export function mapToMediaItem(
  driveFile: any,
  albumId: string
): Media | null {
  const id = driveFile?.id
  const name = driveFile?.name
  const mimeType = driveFile?.mimeType
  const imageMediaMetadata = driveFile?.imageMediaMetadata
  const videoMediaMetadata = driveFile?.videoMediaMetadata
  const createdTime = driveFile?.createdTime
  const modifiedTime = driveFile?.modifiedTime

  if (!id || !name || !mimeType) {
    return null
  }

  const mediaType = getMediaType(mimeType)
  if (!mediaType) {
    return null
  }

  // Extract dimensions from metadata
  let width = imageMediaMetadata?.width || videoMediaMetadata?.width || 1920
  let height = imageMediaMetadata?.height || videoMediaMetadata?.height || 1080
  let duration = videoMediaMetadata?.durationMillis
    ? Math.round(videoMediaMetadata.durationMillis / 1000)
    : undefined

  // Ensure we have valid dimensions
  width = Math.max(1, width || 1920)
  height = Math.max(1, height || 1080)

  // Extract year using priority order
  const year = extractYearFromMetadata(name, createdTime, modifiedTime)

  return {
    id,
    type: mediaType,
    fileName: name,
    title: name,
    date: undefined,
    year,
    width,
    height,
    duration,
    thumbnailUrl: `/api/media/${id}/thumbnail`,
    mediaUrl: `/api/media/${id}`,
  }
}

/**
 * Transforma una carpeta de Google Drive (álbum) en nuestro modelo de Album
 */
export function mapToAlbum(
  driveFolder: any,
  category: string,
  coverImage: string,
  mediaItems: Media[]
): Album | null {
  const id = driveFolder?.id
  const name = driveFolder?.name

  if (!id || !name) {
    return null
  }

  // Intentar extraer el año del nombre del álbum (ej: "Mi Viaje 2024")
  const yearMatch = name.match(/(\d{4})/)
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()

  return {
    id,
    title: name,
    year,
    category,
    coverImage,
    mediaCount: mediaItems.length,
    media: mediaItems,
    dominantColor: { h: 0, s: 0, l: 50 }, // Color por defecto, futuro: extraer de la portada
    description: undefined,
  }
}

/**
 * Transforma una carpeta de Google Drive (categoría) en nuestro modelo de Category
 */
export function mapToCategory(
  driveFolder: any,
  albumCount: number
): Category | null {
  const id = driveFolder?.id
  const name = driveFolder?.name

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    albumCount,
  }
}

/**
 * Valida si un archivo es un tipo de media soportado
 */
export function isMediaFile(mimeType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/mpeg',
  ]
  return supportedTypes.includes(mimeType)
}

/**
 * Detecta si un archivo es una portada válida
 */
export function isCoverFile(fileName: string): boolean {
  const coverPattern = /^cover\.(jpg|jpeg|png|webp)$/i
  return coverPattern.test(fileName)
}

/**
 * Detecta el tipo de media basado en el MIME type
 */
export function getMediaType(mimeType: string): 'image' | 'video' | null {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return null
}

/**
 * Obtiene la URL de descarga de un archivo de Google Drive
 */
export function getDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}`
}

/**
 * Obtiene la URL de vista previa (thumbnail) si está disponible
 */
export function getDriveThumbnailUrl(fileId: string): string {
  return `https://drive-thumnail.googleusercontent.com/d/${fileId}`
}
