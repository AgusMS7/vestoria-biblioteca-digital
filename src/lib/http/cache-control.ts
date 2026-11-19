/**
 * Catálogo: cache de CDN de 1 h con revalidación en segundo plano.
 * Coincide con el TTL de la caché en memoria de las categorías y álbumes.
 */
export const CATALOG_CACHE_CONTROL =
  'public, s-maxage=3600, stale-while-revalidate=86400'

/** Las respuestas de error nunca se cachean. */
export const ERROR_CACHE_CONTROL = 'no-store'
