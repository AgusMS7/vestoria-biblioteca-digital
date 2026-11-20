export type { ICache } from './cache.interface'
export { MemoryCache } from './memory.cache'

import { MemoryCache } from './memory.cache'
import type { Category } from '@/types/category'
import type { Album } from '@/types/album'

/**
 * Instancias singleton de caché para diferentes tipos de datos
 * Preparadas para futuro uso en servicios
 */
export const categoryCache = new MemoryCache<Category[]>()
export const albumCache = new MemoryCache<Album[]>()

/** Fecha EXIF por `id+modifiedTime`; `null` = se intentó y no había. */
export const exifDateCache = new MemoryCache<{
  year: number
  month?: number
} | null>()
