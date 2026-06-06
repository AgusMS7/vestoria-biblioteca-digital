/**
 * Interfaz de caché genérica
 * Define el contrato para cualquier implementación de caché
 */
export interface ICache<T> {
  /**
   * Obtiene un valor del caché
   * @returns El valor en caché o undefined si no existe o expiró
   */
  get(key: string): T | undefined

  /**
   * Almacena un valor en el caché
   * @param ttl Tiempo de vida en milisegundos (opcional)
   */
  set(key: string, value: T, ttl?: number): void

  /**
   * Elimina un valor específico del caché
   */
  delete(key: string): boolean

  /**
   * Limpia todo el caché
   */
  clear(): void

  /**
   * Obtiene información de estadísticas del caché
   */
  stats(): { size: number; keys: string[] }
}
