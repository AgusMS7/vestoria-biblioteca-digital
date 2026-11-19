import { getCategories, getAlbums, isDriveNotFoundError } from '@/lib/google-drive'
import { mapWithConcurrency } from '@/lib/utils/concurrency'
import { isGoogleConfigured } from '@/config/env'
import { LibraryClient } from '@/components/library/LibraryClient'
import type { Album, Category } from '@/types'

/**
 * La home se renderiza en el servidor con los datos ya resueltos para no
 * mostrar el estado vacío antes de hidratar. El cliente queda para búsqueda y
 * orden. Sin caché estática: la lista vive en Google Drive y puede cambiar.
 */
export const dynamic = 'force-dynamic'

type LoadError = 'config' | 'unknown'

async function loadLibrary(): Promise<{
  categories: Category[]
  categoryAlbums: Record<string, Album[]>
  error: LoadError | null
}> {
  const categoryAlbums: Record<string, Album[]> = {}
  let categories: Category[] = []

  try {
    categories = await getCategories()
  } catch (error) {
    console.error('Error loading categories:', error)
    return {
      categories: [],
      categoryAlbums,
      error: isGoogleConfigured() ? 'unknown' : 'config',
    }
  }

  try {
    const entries = await mapWithConcurrency(categories, 4, async (category) => {
      try {
        return [category.name, await getAlbums(category.id)] as const
      } catch (error) {
        // Una categoría borrada entre llamadas no debe tumbar la home.
        if (isDriveNotFoundError(error)) return null
        throw error
      }
    })

    for (const entry of entries) {
      if (entry) {
        // La home no navega los medios: se envían solo portada y conteos.
        categoryAlbums[entry[0]] = entry[1].map((album) => ({
          ...album,
          media: [],
        }))
      }
    }
  } catch (error) {
    console.error('Error loading albums:', error)
    return {
      categories: [],
      categoryAlbums: {},
      error: isGoogleConfigured() ? 'unknown' : 'config',
    }
  }

  return { categories, categoryAlbums, error: null }
}

export default async function LibraryPage() {
  const { categories, categoryAlbums, error } = await loadLibrary()

  return (
    <LibraryClient
      initialCategories={categories}
      initialCategoryAlbums={categoryAlbums}
      initialError={error}
    />
  )
}
