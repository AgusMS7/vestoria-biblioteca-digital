import type { ICache } from './cache.interface'

interface CacheEntry<T> {
  value: T
  expiresAt?: number
}

/**
 * Caché en memoria simple
 * Almacena valores en memoria con soporte opcional para TTL
 * Implementación básica preparada para futuras mejoras
 */
export class MemoryCache<T> implements ICache<T> {
  private store = new Map<string, CacheEntry<T>>()

  get(key: string): T | undefined {
    const entry = this.store.get(key)

    if (!entry) {
      return undefined
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }

    return entry.value
  }

  set(key: string, value: T, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : undefined
    this.store.set(key, { value, expiresAt })
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  stats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    }
  }
}
