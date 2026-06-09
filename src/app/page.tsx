'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Header, AlbumCard, TextureFilters, LoadingOverlay } from '@/components'
import type { Category, Album } from '@/types'

function WoodShelf({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-6 sm:px-10 lg:px-16 py-6 pb-10">
        {children}
      </div>

      <div className="relative">
        <div className="wood-shelf h-14 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 15%, transparent 70%, rgba(0,0,0,0.3) 100%)',
            }}
          />

          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="wood-engraved text-base sm:text-lg uppercase tracking-[0.15em]">
              {label}
            </span>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
            }}
          />
        </div>

        <div
          className="h-6"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          }}
        />
      </div>
    </section>
  )
}

type SortOrder = 'asc' | 'desc'

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryAlbums, setCategoryAlbums] = useState<Record<string, Album[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load categories and albums on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get categories
        const categoriesRes = await fetch('/api/categories')
        if (!categoriesRes.ok) {
          throw new Error('Failed to load categories')
        }
        const categoriesData = await categoriesRes.json()
        const cats = (categoriesData.data || []) as Category[]
        setCategories(cats)

        // Get albums for each category
        const albumsByCategory: Record<string, Album[]> = {}
        for (const category of cats) {
          const albumsRes = await fetch(`/api/categories/${category.id}/albums`)
          if (albumsRes.ok) {
            const albumsData = await albumsRes.json()
            albumsByCategory[category.name] = (albumsData.data || []) as Album[]
          }
        }
        setCategoryAlbums(albumsByCategory)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        console.error('Error loading albums:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch = cat.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [categories, searchQuery])

  const filteredAlbums = useMemo(() => {
    const albums = Object.values(categoryAlbums).flat()
    return albums.filter((album) => {
      const matchesSearch =
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.category.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [categoryAlbums, searchQuery])

  const groupedAlbums = useMemo(() => {
    return categories
      .filter((cat) => categoryAlbums[cat.name])
      .map((cat) => {
        // Filtrar álbumes por título o categoría
        let albums = categoryAlbums[cat.name].filter((album) => {
          const matchesTitle = album.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
          const matchesCategory = cat.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
          return matchesTitle || matchesCategory
        })

        // Aplicar ordenamiento
        albums = [...albums].sort((a, b) => {
          const comparison = a.title.localeCompare(b.title, 'es', {
            numeric: true,
            sensitivity: 'base',
          })
          return sortOrder === 'asc' ? comparison : -comparison
        })

        return {
          label: cat.name,
          albums,
        }
      })
      .filter((group) => group.albums.length > 0)
  }, [categories, categoryAlbums, searchQuery, sortOrder])

  let globalIndex = 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(25 20% 10%)' }}>
      <TextureFilters />
      <LoadingOverlay isVisible={loading} />

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      <div className="flex min-h-[calc(100vh-180px)]">
        <div
          className="wood-frame-left w-4 sm:w-6 lg:w-10 xl:w-14 flex-shrink-0 relative z-30"
          style={{
            boxShadow:
              '4px 0 15px rgba(0,0,0,0.6), inset -2px 0 6px rgba(0,0,0,0.4)',
          }}
        />

        <main className="wood-back-wall flex-1 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              boxShadow:
                'inset 0 0 80px rgba(0,0,0,0.6), inset 0 0 150px rgba(0,0,0,0.3)',
            }}
          />

          <div className="relative z-10 py-4 sm:py-6">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <p className="text-xl text-red-400">Error al cargar</p>
                <p className="text-sm text-red-300/70 mt-2">{error}</p>
              </motion.div>
            ) : groupedAlbums.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <p className="text-xl text-amber-200/80">
                  No hay álbumes disponibles
                </p>
                <p className="text-amber-100/40 mt-2">
                  Agrega categorías y álbumes a tu Google Drive para comenzar
                </p>
              </motion.div>
            ) : (
              groupedAlbums.map(({ label, albums: groupAlbums }) => {
                const startIndex = globalIndex
                globalIndex += groupAlbums.length
                return (
                  <WoodShelf key={label} label={String(label)}>
                    {groupAlbums.map((album, idx) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        index={startIndex + idx}
                      />
                    ))}
                  </WoodShelf>
                )
              })
            )}
          </div>
        </main>

        <div
          className="wood-frame-right w-4 sm:w-6 lg:w-10 xl:w-14 flex-shrink-0 relative z-30"
          style={{
            boxShadow:
              '-4px 0 15px rgba(0,0,0,0.6), inset 2px 0 6px rgba(0,0,0,0.4)',
          }}
        />
      </div>


    </div>
  )
}
