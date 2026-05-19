import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { AlbumCard } from '@/components/AlbumCard'
import { albums, categories } from '@/data/albums'

type GroupBy = 'year' | 'category'

// Repisa de madera con texto grabado
function WoodShelf({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-0">
      {/* Albums sobre el estante */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-6 sm:px-10 lg:px-16 py-6 pb-10">
        {children}
      </div>
      
      {/* Estante de madera que cruza de lado a lado */}
      <div className="relative">
        {/* Repisa principal — CSS walnut */}
        <div
          className="wood-shelf h-14 relative overflow-hidden"
        >
          {/* Overlay para efecto de profundidad */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 15%, transparent 70%, rgba(0,0,0,0.3) 100%)',
            }}
          />
          
          {/* Surco superior */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
            }}
          />
          
          {/* Texto grabado en la repisa */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="wood-engraved text-base sm:text-lg uppercase tracking-[0.15em]">
              {label}
            </span>
          </div>
          
          {/* Surco inferior */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
            }}
          />
        </div>
        
        {/* Sombra debajo del estante */}
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

export function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('year')

  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.description?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [searchQuery])

  // Agrupar por ano
  const albumsByYear = useMemo(() => {
    const grouped: Record<number, typeof albums> = {}
    filteredAlbums.forEach((album) => {
      if (!grouped[album.year]) grouped[album.year] = []
      grouped[album.year].push(album)
    })
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, yearAlbums]) => ({ label: year, albums: yearAlbums }))
  }, [filteredAlbums])

  // Agrupar por categoria
  const albumsByCategory = useMemo(() => {
    const grouped: Record<string, typeof albums> = {}
    filteredAlbums.forEach((album) => {
      if (!grouped[album.category]) grouped[album.category] = []
      grouped[album.category].push(album)
    })
    return categories
      .filter(cat => grouped[cat])
      .map(cat => ({ label: cat, albums: grouped[cat] }))
  }, [filteredAlbums])

  const groupedAlbums = groupBy === 'year' ? albumsByYear : albumsByCategory

  let globalIndex = 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(25 20% 10%)' }}>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />

      {/* Contenedor de la biblioteca */}
      <div className="flex min-h-[calc(100vh-180px)]">
        {/* Marco izquierdo — CSS walnut */}
        <div
          className="wood-frame-left w-4 sm:w-6 lg:w-10 xl:w-14 flex-shrink-0 relative z-30"
          style={{
            boxShadow: '4px 0 15px rgba(0,0,0,0.6), inset -2px 0 6px rgba(0,0,0,0.4)',
          }}
        />
        
        {/* Contenido central — CSS dark wall */}
        <main
          className="wood-back-wall flex-1 relative overflow-hidden"
        >
          {/* Sombra interior para dar profundidad */}
          <div 
            className="absolute inset-0 pointer-events-none z-20" 
            style={{ 
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), inset 0 0 150px rgba(0,0,0,0.3)' 
            }} 
          />
          
          <div className="relative z-10 py-4 sm:py-6">
            {groupedAlbums.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <p className="text-xl text-amber-200/80">
                  No se encontraron albums
                </p>
                <p className="text-amber-100/40 mt-2">
                  Intenta ajustar la busqueda
                </p>
              </motion.div>
            ) : (
              groupedAlbums.map(({ label, albums: groupAlbums }) => {
                const startIndex = globalIndex
                globalIndex += groupAlbums.length
                return (
                  <WoodShelf key={label} label={label}>
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
        
        {/* Marco derecho — CSS walnut */}
        <div
          className="wood-frame-right w-4 sm:w-6 lg:w-10 xl:w-14 flex-shrink-0 relative z-30"
          style={{
            boxShadow: '-4px 0 15px rgba(0,0,0,0.6), inset 2px 0 6px rgba(0,0,0,0.4)',
          }}
        />
      </div>

      {/* Pie de pagina — CSS dark wood */}
      <footer
        className="wood-dark py-5 relative"
      >
        <div className="absolute inset-0 bg-black/25" />
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}
        />
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <p className="text-amber-200/70 text-sm tracking-wide">
            Biblioteca Rosana — Recuerdos que duran para siempre
          </p>
        </div>
      </footer>
    </div>
  )
}
