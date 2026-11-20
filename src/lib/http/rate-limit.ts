export interface RateLimitResult {
  allowed: boolean
  /** Segundos hasta que se reponga al menos un token. */
  retryAfterSeconds: number
}

export interface RateLimiterOptions {
  /** Tokens disponibles por ventana (capacidad del bucket). */
  limit: number
  /** Ventana de reposición completa, en milisegundos. */
  windowMs: number
  /** Tope de claves en memoria; al superarlo se limpian las vencidas. */
  maxEntries?: number
}

interface Bucket {
  tokens: number
  updatedAt: number
}

/**
 * Token bucket en memoria por clave (IP). Cada instancia/edge tiene su propio
 * estado, suficiente como freno básico contra loops y crawlers.
 */
export function createRateLimiter({
  limit,
  windowMs,
  maxEntries = 10_000,
}: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>()

  function prune(now: number): void {
    if (buckets.size < maxEntries) {
      return
    }

    for (const [key, bucket] of buckets) {
      if (now - bucket.updatedAt > windowMs * 2) {
        buckets.delete(key)
      }
    }

    if (buckets.size >= maxEntries) {
      buckets.clear()
    }
  }

  return function take(key: string, now = Date.now()): RateLimitResult {
    prune(now)

    const bucket = buckets.get(key)
    const elapsed = bucket ? Math.max(0, now - bucket.updatedAt) : windowMs
    const refilled = bucket
      ? Math.min(limit, bucket.tokens + (elapsed / windowMs) * limit)
      : limit

    if (refilled < 1) {
      const missing = 1 - refilled
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((missing / limit) * (windowMs / 1000))
      )

      buckets.set(key, { tokens: refilled, updatedAt: now })

      return { allowed: false, retryAfterSeconds }
    }

    buckets.set(key, { tokens: refilled - 1, updatedAt: now })

    return { allowed: true, retryAfterSeconds: 0 }
  }
}
