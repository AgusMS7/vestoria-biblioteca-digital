/**
 * Ejecuta `task` sobre cada item con un máximo de `limit` promesas en vuelo.
 * Mantiene el orden de los resultados y se detiene en el primer error, igual
 * que `Promise.all`.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const workerCount = Math.max(1, Math.min(limit, items.length))

  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await task(items[index], index)
    }
  })

  await Promise.all(workers)

  return results
}
