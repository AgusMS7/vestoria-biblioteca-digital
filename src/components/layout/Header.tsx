'use client'

import { Search, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib'
import { useSiteName } from './SiteNameContext'

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
  const siteName = useSiteName()

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <header className="sticky top-0 z-50 header-in">
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
            <div className="flex items-center justify-center lg:justify-start gap-3 transition-transform duration-300 hover:scale-[1.01]">
              <img
                src="/book-gift-present-svgrepo-com.svg"
                alt={siteName}
                className="header-logo-engraved w-8 h-8 sm:w-10 sm:h-10"
              />
              <h1 className="text-3xl sm:text-4xl header-title-engraved tracking-wide">
                {siteName}
              </h1>
            </div>

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

              <button
                onClick={toggleSort}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm',
                  'text-sm font-medium tracking-wide cursor-pointer',
                  'transition-all duration-200 relative z-10',
                  'hover:scale-105 active:scale-95'
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
              </button>
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
    </header>
  )
}
