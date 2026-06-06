export interface MediaItem {
  id: string
  type: 'image' | 'video'
  src: string
  thumbnail: string
  title?: string
  date?: string
}

export interface Album {
  id: string
  title: string
  year: number
  category: string
  coverImage: string
  description?: string
  mediaCount: number
  media: MediaItem[]
  dominantColor: { h: number; s: number; l: number }
}
