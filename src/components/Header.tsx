import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type GroupBy = 'year' | 'category'

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  groupBy: GroupBy
  setGroupBy: (groupBy: GroupBy) => void
}

export function Header({
  searchQuery,
  setSearchQuery,
  groupBy,
  setGroupBy,
}: HeaderProps) {

  return (
    <>
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
                className="flex items-center justify-center lg:justify-start"
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <h1 className="text-3xl sm:text-4xl header-title-engraved tracking-wide">
                  Biblioteca Rosana
                </h1>
              </motion.div>

              <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-xl lg:ml-8">
                {/* Barra de Busqueda */}
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
                    placeholder="Buscar recuerdos..."
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

                {/* Selector — se usa select nativo para desplegable consistente */}
                <div className="relative">
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-[hsl(35_45%_60%)]" />
                  </div>
                  <select
                    value={groupBy}
                    onChange={(event) => setGroupBy(event.target.value as GroupBy)}
                    className={cn(
                      'appearance-none px-4 py-2.5 rounded-sm w-full sm:w-auto',
                      'transition-all duration-200 min-w-[160px]',
                      'text-sm font-medium tracking-wide cursor-pointer pr-10',
                      'wood-input'
                    )}
                    style={{
                      color: 'hsl(35 45% 70%)',
                      fontFamily: 'var(--font-serif)',
                    }}
                    aria-label="Agrupar por"
                  >
                    <option value="year">Por Año</option>
                    <option value="category">Por Categoría</option>
                  </select>
                </div>
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
    </>
  )
}
