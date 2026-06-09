/**
 * Archivo multimedia individual
 * Representa una imagen o video dentro de un álbum
 */
export interface Media {
  id: string
  type: 'image' | 'video'
  fileName: string
  title?: string
  date?: string
  year?: number
  month?: number
  width: number
  height: number
  duration?: number
  thumbnailUrl: string
  mediaUrl: string
}
