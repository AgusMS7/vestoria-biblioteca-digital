/**
 * Archivo multimedia individual
 * Representa una imagen o video dentro de un álbum
 */
export interface Media {
  id: string
  type: 'image' | 'video'
  src: string
  thumbnail?: string
  title?: string
  date?: string
  fileName: string
}
