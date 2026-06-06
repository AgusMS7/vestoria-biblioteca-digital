import { getDriveClient } from './client'
import {
  mapToAlbum,
  mapToCategory,
  mapToMediaItem,
  isCoverFile,
  isMediaFile,
} from './mapper'
import { categoryCache, albumCache, mediaCache, coverCache } from '@/lib/cache'
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
      fields: 'files(id, name)',
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
  folderData: any
): Promise<Album | null> {
  try {
    const drive = getDriveClient()

    // Obtener todos los archivos del álbum
    const filesResponse = await drive.files.list({
      q: `'${albumId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, webContentLink, thumbnailLink)',
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
      coverImage = `https://drive.google.com/uc?id=${coverFile.id}`
    } else if (mediaFiles.length > 0) {
      coverImage = `https://drive.google.com/uc?id=${mediaFiles[0].id}`
    }

    // Mapear archivos multimedia
    const media = mediaFiles
      .map((file) => mapToMediaItem(file, albumId))
      .filter((m): m is Media => m !== null)

    // Mapear álbum
    return mapToAlbum(folderData, category, coverImage, media)
  } catch (error) {
    console.error('Error getting album details:', error)
    throw error
  }
}

/**
 * Obtiene todos los archivos multimedia de un álbum
 */
export async function getMedia(albumId: string): Promise<Media[]> {
  const cacheKey = `media_${albumId}`
  const cached = mediaCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const drive = getDriveClient()

    const response = await drive.files.list({
      q: `'${albumId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, webContentLink, thumbnailLink)',
      pageSize: 1000,
      orderBy: 'name',
    })

    const media = (response.data.files || [])
      .filter((f) => !isCoverFile(f.name || '')) // Excluir portadas
      .filter((f) => isMediaFile(f.mimeType || ''))
      .map((file) => mapToMediaItem(file, albumId))
      .filter((m): m is Media => m !== null)

    // Cachear por 30 minutos (180000 ms)
    mediaCache.set(cacheKey, media, 1800000)
    return media
  } catch (error) {
    console.error('Error getting media:', error)
    throw error
  }
}

/**
 * Obtiene la portada de un álbum
 * Busca cover.* primero, luego usa la primera imagen
 */
export async function getAlbumCover(albumId: string): Promise<Media | null> {
  const cacheKey = `cover_${albumId}`
  const cached = coverCache.get(cacheKey)
  if (cached) {
    return cached === 'none' ? null : cached
  }

  try {
    const drive = getDriveClient()

    const response = await drive.files.list({
      q: `'${albumId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, webContentLink, thumbnailLink)',
      pageSize: 1000,
      orderBy: 'name',
    })

    const files = response.data.files || []

    // Buscar cover file
    let coverFile = files.find((f) => isCoverFile(f.name || ''))

    // Si no hay cover file, usar primer media
    if (!coverFile) {
      coverFile = files.find((f) => isMediaFile(f.mimeType || ''))
    }

    if (!coverFile) {
      coverCache.set(cacheKey, 'none', 3600000)
      return null
    }

    const cover = mapToMediaItem(coverFile, albumId)
    if (cover) {
      coverCache.set(cacheKey, cover, 3600000)
    }

    return cover || null
  } catch (error) {
    console.error('Error getting album cover:', error)
    throw error
  }
}

/**
 * Lista el contenido directo de una carpeta de Google Drive
 * Usada por la API de prueba para validar la conexión
 */
export async function listFolderContents(
  folderId: string
): Promise<
  Array<{
    id?: string | null
    name?: string | null
    mimeType?: string | null
  }>
> {
  try {
    const drive = getDriveClient()
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, webContentLink, thumbnailLink)',
      pageSize: 100,
    })

    return response.data.files || []
  } catch (error) {
    console.error('Error listing folder contents:', error)
    throw error
  }
}

/**
 * Invalida la caché de un álbum específico
 * Útil cuando se sabe que ha habido cambios en Drive
 */
export function invalidateAlbumCache(albumId: string): void {
  mediaCache.delete(`media_${albumId}`)
  coverCache.delete(`cover_${albumId}`)
}

/**
 * Invalida la caché de una categoría específica
 */
export function invalidateCategoryCache(categoryId: string): void {
  albumCache.delete(`category_${categoryId}`)
}

/**
 * Invalida toda la caché
 */
export function invalidateAllCache(): void {
  categoryCache.clear()
  albumCache.clear()
  mediaCache.clear()
  coverCache.clear()
}
