export type { ICache } from './cache.interface'
export { MemoryCache } from './memory.cache'

import { MemoryCache } from './memory.cache'
import type { Category } from '@/types/category'
import type { Album } from '@/types/album'
import type { Media } from '@/types/media'

/**
 * Instancias singleton de caché para diferentes tipos de datos
 * Preparadas para futuro uso en servicios
 */
export const categoryCache = new MemoryCache<Category[]>()
export const albumCache = new MemoryCache<Album[]>()
export const mediaCache = new MemoryCache<Media[]>()
export const coverCache = new MemoryCache<Media | 'none'>()
