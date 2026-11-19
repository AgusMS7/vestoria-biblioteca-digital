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

    const response = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
      pageSize: 100,
      orderBy: 'name',
    })

    const categories: Category[] = []

    if (response.data.files) {
      for (const folder of response.data.files) {
        // Contar álbumes en cada categoría
        const albumsResponse = await drive.files.list({
          q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          spaces: 'drive',
          fields: 'files(id)',
          pageSize: 1,
        })

        const albumCount = albumsResponse.data.files?.length || 0
        const category = mapToCategory(folder, albumCount)

        if (category) {
          categories.push(category)
        }
      }
    }

    // Cachear por 1 hora (3600000 ms)
    categoryCache.set('all', categories, 3600000)
    return categories
  } catch (error) {
    console.error('Error getting categories:', error)
    throw error
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
    const response = await drive.files.list({
      q: `'${categoryId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, imageMediaMetadata, videoMediaMetadata)',
      pageSize: 100,
      orderBy: 'name',
    })

    const albums: Album[] = []

    if (response.data.files) {
      for (const folder of response.data.files) {
        const album = await getAlbumDetails(folder.id!, categoryName, folder)
        if (album) {
          albums.push(album)
        }
      }
    }

    // Cachear por 1 hora
    albumCache.set(cacheKey, albums, 3600000)
    return albums
  } catch (error) {
    console.error('Error getting albums:', error)
    throw error
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
    throw error
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
    const filesResponse = await drive.files.list({
      q: `'${albumId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, imageMediaMetadata, videoMediaMetadata, modifiedTime)',
      pageSize: 1000,
      orderBy: 'name',
    })

    const files = filesResponse.data.files || []

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
      coverImage = `/api/media/${coverFile.id}/thumbnail`
    } else if (mediaFiles.length > 0) {
      coverImage = `/api/media/${mediaFiles[0].id}/thumbnail`
    }

    // Mapear archivos multimedia
    const media = mediaFiles
      .map((file) => mapToMediaItem(file))
      .filter((m): m is Media => m !== null)

    // Mapear álbum
    return mapToAlbum(folderData, category, coverImage, media)
  } catch (error) {
    console.error('Error getting album details:', error)
    throw error
  }
}


