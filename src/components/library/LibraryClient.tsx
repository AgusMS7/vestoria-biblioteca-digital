'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, RotateCw } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AlbumCard } from '@/components/library/AlbumCard'
import { TextureFilters } from '@/components/ui/TextureFilters'
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
type LoadError = 'config' | 'unknown'

interface LibraryClientProps {
  initialCategories: Category[]
  initialCategoryAlbums: Record<string, Album[]>
  initialError: LoadError | null
}

export function LibraryClient({
  initialCategories,
  initialCategoryAlbums,
  initialError,
}: LibraryClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const groupedAlbums = useMemo(() => {
    return initialCategories
      .filter((cat) => initialCategoryAlbums[cat.name])
      .map((cat) => {
        // Filtrar álbumes por título o categoría
        let albums = initialCategoryAlbums[cat.name].filter((album) => {
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
  }, [initialCategories, initialCategoryAlbums, searchQuery, sortOrder])

  let globalIndex = 0

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: 'hsl(25 20% 10%)' }}>
      <TextureFilters />

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      <div className="flex flex-1">
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

          <div className="relative z-10 pt-4 sm:pt-6 pb-2">
            {initialError ? (
              <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-4 py-8 fade-in-up">
                <AlertCircle
                  className="header-logo-engraved h-10 w-10 mb-4"
                  style={{ color: 'hsl(35 45% 70%)' }}
                />
                <h2 className="wood-engraved text-xl sm:text-2xl">
                  {initialError === 'config'
                    ? 'Error al conectar con la biblioteca'
                    : 'Error al cargar la biblioteca'}
                </h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(35 30% 62%)' }}>
                  {initialError === 'config'
                    ? 'Revisá la configuración de Google Drive del servidor.'
                    : 'No se pudieron obtener los álbumes. Intentá de nuevo en unos minutos.'}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-7 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-medium tracking-wide cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 24%, rgba(0,0,0,0.45) 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), inset 0 -4px 10px rgba(0,0,0,0.65)',
                    color: 'hsl(35 45% 70%)',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  <RotateCw className="h-4 w-4" />
                  Recargar
                </button>
              </div>
            ) : groupedAlbums.length === 0 ? (
              <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-4 py-8 fade-in-up">
                <p className="text-xl text-amber-200/80">
                  No hay álbumes disponibles
                </p>
                <p className="text-amber-100/40 mt-2">
                  Agrega categorías y álbumes a tu Google Drive para comenzar
                </p>
              </div>
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

      <Footer />
    </div>
  )
}
