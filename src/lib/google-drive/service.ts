import { getDriveClient } from './client'
import type { drive_v3 } from 'googleapis'
import {
  mapToAlbum,
  mapToCategory,
  mapToMediaItem,
  isCoverFile,
  isMediaFile,
} from './mapper'
import { categoryCache, albumCache } from '@/lib/cache'
import { mapWithConcurrency } from '@/lib/utils/concurrency'
import { listAllFiles } from './list'
import { extractYearMonthFromName } from './date-extractor'
import { readExifDates } from './exif-reader'
import { rethrowDriveError } from './errors'
import { env } from '@/config/env'
import type { Album } from '@/types/album'
import type { Media } from '@/types/media'
import type { Category } from '@/types/category'

/**
 * Obtiene todas las categorías de Google Drive
 * Las categorías son carpetas de primer nivel en GOOGLE_ROOT_FOLDER_ID
 */
export async function getCategories(): Promise<Category[]> {
  const cached = categoryCache.get('all')
  if (cached) {
    return cached
  }

  try {
    const drive = getDriveClient()
    const rootFolderId = env.google.rootFolderId

    const folders = await listAllFiles(drive, {
      q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
      pageSize: 100,
      orderBy: 'name',
    })

    const categories: Category[] = []

    for (const folder of folders) {
      const category = mapToCategory(folder)

      if (category) {
        categories.push(category)
      }
    }

    // Cachear por 1 hora (3600000 ms)
    categoryCache.set('all', categories, 3600000)
    return categories
  } catch (error) {
    console.error('Error getting categories:', error)
    rethrowDriveError(error)
  }
}

/**
 * Obtiene todos los álbumes de una categoría específica
 */
export async function getAlbums(categoryId: string): Promise<Album[]> {
  const cacheKey = `category_${categoryId}`
  const cached = albumCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const drive = getDriveClient()

    // Obtener la categoría para su nombre
    const categoryResponse = await drive.files.get({
      fileId: categoryId,
      fields: 'id, name',
    })

    const categoryName = categoryResponse.data.name || 'Unknown'

    // Listar álbumes en la categoría
    const folders = await listAllFiles(drive, {
      q: `'${categoryId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, imageMediaMetadata, videoMediaMetadata)',
      pageSize: 100,
      orderBy: 'name',
    })

    const albums: Album[] = []

    const albumFolders = folders.filter((folder) => folder.id)

    const details = await mapWithConcurrency(albumFolders, 4, (folder) =>
      getAlbumDetails(folder.id!, categoryName, folder)
    )

    for (const album of details) {
      if (album) {
        albums.push(album)
      }
    }

    // Cachear por 1 hora
    albumCache.set(cacheKey, albums, 3600000)
    return albums
  } catch (error) {
    console.error('Error getting albums:', error)
    rethrowDriveError(error)
  }
}

/**
 * Obtiene un álbum específico por su ID
 */
export async function getAlbum(albumId: string): Promise<Album | null> {
  try {
    const drive = getDriveClient()

    // Obtener información del álbum
    const folderResponse = await drive.files.get({
      fileId: albumId,
      fields: 'id, name, parents',
    })

    if (!folderResponse.data.name) {
      return null
    }

    // Obtener la categoría padre
    const parentId = folderResponse.data.parents?.[0]
    let categoryName = 'Unknown'

    if (parentId) {
      const parentResponse = await drive.files.get({
        fileId: parentId,
        fields: 'name',
      })
      categoryName = parentResponse.data.name || 'Unknown'
    }

    return getAlbumDetails(albumId, categoryName, folderResponse.data)
  } catch (error) {
    console.error('Error getting album:', error)
    rethrowDriveError(error)
  }
}

/**
 * Obtiene los detalles completos de un álbum incluyendo media y portada
 */
async function getAlbumDetails(
  albumId: string,
  category: string,
  folderData: drive_v3.Schema$File
): Promise<Album | null> {
  try {
    const drive = getDriveClient()

    // Obtener todos los archivos del álbum (incluyendo timestamps)
    const files = await listAllFiles(drive, {
      q: `'${albumId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, imageMediaMetadata, videoMediaMetadata, modifiedTime)',
      pageSize: 1000,
      orderBy: 'name',
    })

    // Separar portada y medias
    let coverFile = null
    const mediaFiles = []

    for (const file of files) {
      if (isCoverFile(file.name || '')) {
        coverFile = file
      } else if (isMediaFile(file.mimeType || '')) {
        mediaFiles.push(file)
      }
    }

    // Obtener portada (primero cover file, sino primer media)
    let coverImage = ''
    if (coverFile) {
      coverImage = `/api/media/${coverFile.id}/thumbnail?size=large`
    } else if (mediaFiles.length > 0) {
      coverImage = `/api/media/${mediaFiles[0].id}/thumbnail?size=large`
    }

    // Mapear archivos multimedia
    const media = mediaFiles
      .map((file) => mapToMediaItem(file))
      .filter((m): m is Media => m !== null)

    // EXIF solo como respaldo de los medios sin fecha en el nombre.
    await applyExifFallback(drive, mediaFiles, media)

    // Mapear álbum
    return mapToAlbum(folderData, category, coverImage, media)
  } catch (error) {
    console.error('Error getting album details:', error)
    rethrowDriveError(error)
  }
}



/**
 * Completa year/month leyendo EXIF DateTimeOriginal de los medios de imagen
 * cuyo nombre no trae fecha. Lo no resuelto queda con modifiedTime.
 */
async function applyExifFallback(
  drive: ReturnType<typeof getDriveClient>,
  files: drive_v3.Schema$File[],
  media: Media[]
): Promise<void> {
  const eligible = files.filter(
    (file) =>
      file.id &&
      file.mimeType &&
      isMediaFile(file.mimeType) &&
      file.mimeType.startsWith('image/') &&
      !extractYearMonthFromName(file.name ?? '')
  )

  if (eligible.length === 0) {
    return
  }

  const dates = await readExifDates(drive, eligible)

  if (dates.size === 0) {
    return
  }

  const mediaById = new Map(media.map((item) => [item.id, item]))

  for (const [id, date] of dates) {
    const item = mediaById.get(id)

    if (item) {
      item.year = date.year
      item.month = date.month
    }
  }
}
