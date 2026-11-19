import type { Media } from './media'

/**
 * Álbum de fotos/videos
 * Representa una carpeta dentro de una categoría en Google Drive
 */
export interface Album {
  id: string
  title: string
  year: number | null
  category: string
  coverImage: string
  description?: string
  mediaCount: number
  photoCount: number
  videoCount: number
  media: Media[]
  dominantColor: { h: number; s: number; l: number }
}
