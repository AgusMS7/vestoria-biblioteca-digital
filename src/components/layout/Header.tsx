'use client'

import { motion } from 'framer-motion'
import { Search, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib'

type SortOrder = 'asc' | 'desc'

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
}

export function Header({
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
}: HeaderProps) {
  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50"
    >
      <div className="wood-dark py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />

        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <motion.div
              className="flex items-center justify-center lg:justify-start gap-3"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <img
                src="/book-gift-present-svgrepo-com.svg"
                alt="Biblioteca Rosanna"
                className="w-8 h-8 sm:w-10 sm:h-10"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5)) drop-shadow(0 -1px 0 rgba(209, 183, 155, 0.25))',
                  color: 'hsl(35 50% 72%)',
                }}
              />
              <h1 className="text-3xl sm:text-4xl header-title-engraved tracking-wide">
                Biblioteca Rosanna
              </h1>
            </motion.div>

            <div className="flex flex-row gap-3 flex-1 lg:max-w-md">
              <div className="relative flex-1">
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 24%, rgba(0,0,0,0.45) 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), inset 0 -4px 10px rgba(0,0,0,0.65)',
                  }}
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10"
                  style={{ color: 'hsl(35 45% 65%)' }}
                />
                <input
                  type="text"
                  placeholder="Buscar categorías y álbumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-sm relative z-10',
                    'text-sm font-medium tracking-wide focus:outline-none',
                    'header-search wood-input transition-all duration-200'
                  )}
                  style={{
                    color: 'hsl(35 45% 70%)',
                    fontFamily: 'var(--font-serif)',
                  }}
                />
              </div>

              <motion.button
                onClick={toggleSort}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm',
                  'text-sm font-medium tracking-wide cursor-pointer',
                  'transition-all duration-200 relative z-10'
                )}
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 24%, rgba(0,0,0,0.45) 100%)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), inset 0 -4px 10px rgba(0,0,0,0.65)',
                  color: 'hsl(35 45% 70%)',
                  fontFamily: 'var(--font-serif)',
                }}
                title={sortOrder === 'asc' ? 'Ordenar Z → A' : 'Ordenar A → Z'}
              >
                {sortOrder === 'asc' ? (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">A-Z</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Z-A</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
          }}
        />
      </div>
    </motion.header>
  )
}
