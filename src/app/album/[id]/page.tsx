'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Play, Calendar, ArrowUp, ArrowDown, Presentation } from 'lucide-react'
import { FullscreenViewer, TextureFilters, AlbumOpeningTransition } from '@/components'
import type { Album, Media } from '@/types'

type YearSortOrder = 'asc' | 'desc'

function getAlbumPageColors(color: { h: number; s: number; l: number }) {
  const { h, s, l } = color
  return {
    header: `hsl(${h} ${Math.min(s + 5, 45)}% ${Math.max(l - 5, 35)}%)`,
    headerLight: `hsl(${h} ${Math.min(s, 40)}% ${Math.min(l + 10, 50)}%)`,
    headerDark: `hsl(${h} ${Math.min(s + 10, 50)}% ${Math.max(l - 15, 22)}%)`,
    titleColor: `hsl(${h} ${Math.min(s + 5, 35)}% ${Math.min(l + 40, 88)}%)`,
    titleShadow: `hsl(${h} ${Math.min(s + 15, 50)}% ${Math.max(l - 20, 18)}%)`,
    subtitleColor: `hsl(${h} ${Math.min(s, 30)}% ${Math.min(l + 30, 75)}%)`,
    accent: `hsl(${h} ${Math.min(s + 10, 70)}% ${Math.min(l + 10, 60)}%)`,
    backBtnBg: `hsl(${h} ${Math.min(s, 35)}% ${Math.min(l + 25, 70)}%)`,
    backBtnColor: `hsl(${h} ${Math.min(s + 10, 45)}% ${Math.max(l - 15, 25)}%)`,
    ringColor: `hsl(${h} ${Math.min(s + 5, 40)}% ${Math.min(l + 5, 48)}%)`,
    ringHighlight: `hsl(${h} ${Math.max(s - 10, 20)}% ${Math.min(l + 25, 70)}%)`,
    buttonHue: h,
    buttonSat: Math.min(s, 40),
    buttonLight: Math.min(l, 45),
    playBtnText: `hsl(${h} ${Math.min(s + 10, 45)}% ${Math.max(l - 15, 25)}%)`,
  }
}

const TAPE_STYLES = [
  {
    rotation: 35,
    top: '-8px',
    right: '-12px',
    left: 'auto',
    bottom: 'auto',
    width: '50px',
  },
  {
    rotation: -35,
    top: '-8px',
    left: '-12px',
    right: 'auto',
    bottom: 'auto',
    width: '50px',
  },
  {
    rotation: 0,
    top: '-6px',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    width: '60px',
    translateX: true,
  },
  {
    rotation: -40,
    bottom: '-8px',
    left: '-10px',
    right: 'auto',
    top: 'auto',
    width: '45px',
  },
  {
    rotation: 5,
    top: '-5px',
    right: '10px',
    left: 'auto',
    bottom: 'auto',
    width: '55px',
  },
  {
    rotation: -30,
    top: '-6px',
    left: '-8px',
    right: 'auto',
    bottom: 'auto',
    width: '40px',
    dual: true,
  },
]

function AdhesiveTape({
  style,
  isSecond = false,
}: {
  style: (typeof TAPE_STYLES)[0]
  isSecond?: boolean
}) {
  const tapeStyle: React.CSSProperties = {
    position: 'absolute',
    top: isSecond ? 'auto' : (style.top as string),
    left: isSecond ? 'auto' : (style.left as string),
    right: isSecond ? '-8px' : (style.right as string),
    bottom: isSecond ? '-6px' : (style.bottom as string),
    width: style.width,
    height: '18px',
    transform: `rotate(${isSecond ? 30 : style.rotation}deg) ${
      style.translateX && !isSecond ? 'translateX(-50%)' : ''
    }`,
    background:
      'linear-gradient(180deg, rgba(235,220,195,0.9) 0%, rgba(220,200,170,0.92) 50%, rgba(205,185,155,0.9) 100%)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    zIndex: 10,
  }
  return <div style={tapeStyle} />
}

function PolaroidPhoto({
  item,
  index,
  onClick,
}: {
  item: { id: string; thumbnailUrl: string; fileName: string; type: string }
  index: number
  onClick: () => void
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const tapeStyle = TAPE_STYLES[index % TAPE_STYLES.length]
  const rotation = ((index * 7) % 9) - 4

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '300px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, scale: 0.9, rotate: rotation - 3 }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative cursor-pointer"
    >
      <div
        className="relative bg-white p-2 pb-4 shadow-lg transition-shadow duration-300 group-hover:shadow-xl"
        style={{
          boxShadow:
            '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <AdhesiveTape style={tapeStyle} />
        {(tapeStyle as any).dual && <AdhesiveTape style={tapeStyle} isSecond />}

        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
          {isVisible ? (
            <>
              <img
                src={item.thumbnailUrl}
                alt={item.fileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Si falla la imagen, mostrar placeholder elegante
                  const img = e.target as HTMLImageElement
                  img.style.display = 'none'
                }}
              />
              <noscript>
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300" />
              </noscript>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <div className="text-gray-400 text-sm">Cargando...</div>
            </div>
          )}

          {item.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg">
                <Play className="w-5 h-5 text-gray-800 fill-gray-800" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  )
}

function BindingRings({
  ringColor,
  ringHighlight,
  paperColor,
}: {
  ringColor: string
  ringHighlight: string
  paperColor: string
}) {
  return (
    <div className="absolute -bottom-4 left-0 right-0 flex justify-between px-8 sm:px-16 md:px-24 lg:px-32 z-30 pointer-events-none">
      <div className="flex gap-6 sm:gap-8">
        {[0, 1].map((i) => (
          <div
            key={`left-${i}`}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full relative"
            style={{
              background: `linear-gradient(145deg, ${ringHighlight} 0%, ${ringColor} 40%, ${ringColor} 60%, ${ringHighlight} 100%)`,
              boxShadow:
                '0 3px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
          >
            <div
              className="absolute inset-[6px] sm:inset-[7px] rounded-full"
              style={{
                background: paperColor,
                boxShadow: 'inset 1px 2px 4px rgba(0,0,0,0.35)',
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-6 sm:gap-8">
        {[0, 1].map((i) => (
          <div
            key={`right-${i}`}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full relative"
            style={{
              background: `linear-gradient(145deg, ${ringHighlight} 0%, ${ringColor} 40%, ${ringColor} 60%, ${ringHighlight} 100%)`,
              boxShadow:
                '0 3px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
          >
            <div
              className="absolute inset-[6px] sm:inset-[7px] rounded-full"
              style={{
                background: paperColor,
                boxShadow: 'inset 1px 2px 4px rgba(0,0,0,0.35)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AlbumPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerAutoPlay, setViewerAutoPlay] = useState(false)
  const [yearSortOrder, setYearSortOrder] = useState<YearSortOrder>('desc')
  const [isOpeningTransition, setIsOpeningTransition] = useState(true)

  // Agrupar medios por mes-año - DEBE estar antes de los early returns
  interface MediaGroup {
    year: number | null
    month: number | null
    label: string
    medios: Media[]
  }

  const groupedByYearMonth = useMemo(() => {
    if (!album) return []

    const groups: Map<string, Media[]> = new Map()
    const groupMetadata: Map<string, { year: number | null; month: number | null }> = new Map()

    // Agrupar
    album.media.forEach((media) => {
      const year = media.year ?? null
      const month = media.month ?? null
      // Usar "YYYY-MM" como clave, con "YYYY-00" para sin mes específico
      const key = year === null ? 'no-date' : `${year}-${String(month || 0).padStart(2, '0')}`

      if (!groups.has(key)) {
        groups.set(key, [])
        groupMetadata.set(key, { year, month })
      }
      groups.get(key)!.push(media)
    })

    // Convertir a array y ordenar
    let sorted = Array.from(groups.entries()).map(([key, medios]) => {
      const { year, month } = groupMetadata.get(key)!

      // Generar label
      let label = ''
      if (year === null) {
        label = 'Sin fecha'
      } else if (month && month >= 1 && month <= 12) {
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        label = `${monthNames[month - 1]} de ${year}`
      } else {
        label = year.toString()
      }

      return { key, year, month, label, medios }
    })

    // Separar grupo sin fecha
    const noDateGroup = sorted.find((g) => g.year === null)
    const withDateGroups = sorted.filter((g) => g.year !== null)

    // Ordenar grupos con fecha
    withDateGroups.sort((a, b) => {
      const aYear = a.year ?? 0
      const aMonth = a.month ?? 0
      const bYear = b.year ?? 0
      const bMonth = b.month ?? 0

      const aDate = aYear * 100 + aMonth
      const bDate = bYear * 100 + bMonth

      return yearSortOrder === 'asc' ? aDate - bDate : bDate - aDate
    })

    // Reconstruir array (sin fecha siempre al final)
    const result = [...withDateGroups]
    if (noDateGroup) {
      result.push(noDateGroup)
    }

    return result
  }, [album, yearSortOrder])

  // Flatten the sorted groups to get the media in display order
  const flattenedAndSortedMedia = useMemo(() => {
    return groupedByYearMonth.flatMap((group) => group.medios)
  }, [groupedByYearMonth])

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsOpeningTransition(true)

        const response = await fetch(`/api/albums/${id}`)
        if (!response.ok) {
          throw new Error('Album not found')
        }

        const data = await response.json()
        setAlbum(data.data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        console.error('Error loading album:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAlbum()
  }, [id])

  const colors = album ? getAlbumPageColors(album.dominantColor) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-zinc-400">Cargando álbum...</p>
        </div>
      </div>
    )
  }

  if (error || !album || !colors) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-zinc-400">
            {error || 'Album no encontrado'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 rounded-lg bg-amber-600 text-white hover:opacity-90 transition-opacity"
          >
            Volver a la biblioteca
          </button>
        </div>
      </div>
    )
  }

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const startSlideshow = () => {
    setViewerIndex(0)
    setViewerAutoPlay(true)
    setViewerOpen(true)
  }

  const toggleYearSort = () => {
    setYearSortOrder(yearSortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="min-h-screen paper-background">
      <TextureFilters />

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 relative"
        style={{
          background: `linear-gradient(180deg, ${colors.headerLight} 0%, ${colors.header} 60%, ${colors.headerDark} 100%)`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
          }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 relative z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                style={{
                  background: `linear-gradient(145deg, ${colors.backBtnBg}, ${colors.ringColor})`,
                  boxShadow:
                    '0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                <ArrowLeft
                  className="w-5 h-5"
                  style={{ color: colors.backBtnColor }}
                />
              </button>

              <div className="flex flex-col">
                <h1
                  className="text-xl sm:text-2xl font-semibold tracking-wide"
                  style={{
                    color: colors.titleColor,
                    fontFamily: 'var(--font-display)',
                    textShadow: `0 2px 4px ${colors.titleShadow}`,
                  }}
                >
                  {album.title}
                </h1>
                <span
                  className="text-sm font-medium tracking-wide mt-0.5"
                  style={{
                    color: colors.subtitleColor,
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                  }}
                >
                  {album.media.length} fotos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleYearSort}
                className="plastic-button flex items-center gap-2 px-4 py-2 cursor-pointer"
                style={{
                  '--btn-hue': colors.buttonHue,
                  '--btn-sat': `${colors.buttonSat}%`,
                  '--btn-light': `${colors.buttonLight}%`,
                } as React.CSSProperties}
                title={yearSortOrder === 'desc' ? 'Ordenar: Más recientes primero' : 'Ordenar: Más antiguos primero'}
              >
                <Calendar
                  className="w-4 h-4"
                  style={{
                    color: colors.playBtnText,
                  }}
                />
                <span
                  className="hidden sm:inline font-semibold text-sm"
                  style={{ color: colors.playBtnText }}
                >
                  {yearSortOrder === 'desc' ? 'Recientes' : 'Antiguos'}
                </span>
              </button>

              <button
                onClick={startSlideshow}
                className="plastic-button flex items-center gap-2 px-4 py-2 cursor-pointer"
                style={{
                  '--btn-hue': colors.buttonHue,
                  '--btn-sat': `${colors.buttonSat}%`,
                  '--btn-light': `${colors.buttonLight}%`,
                } as React.CSSProperties}
              >
                <Presentation
                  className="w-4 h-4"
                  style={{
                    color: colors.playBtnText,
                  }}
                />
                <span
                  className="hidden sm:inline font-semibold text-sm"
                  style={{ color: colors.playBtnText }}
                >
                  Presentación
                </span>
              </button>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-4 translate-y-full pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.12), transparent)',
          }}
        />

        <BindingRings
          ringColor={colors.ringColor}
          ringHighlight={colors.ringHighlight}
          paperColor="#f4ece0"
        />
      </motion.header>

      <div className="h-8" />

      <main className="min-h-[calc(100vh-120px)] relative z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-14">
          {album.media.length === 0 ? (
            <div className="text-center text-zinc-500">
              <p>No hay archivos multimedia en este álbum</p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {groupedByYearMonth.map((group, groupIdx) => {
                let globalIndex = 0
                // Calcular índice global de este grupo
                for (let i = 0; i < groupIdx; i++) {
                  globalIndex += groupedByYearMonth[i].medios.length
                }

                return (
                  <motion.section
                    key={group.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: groupIdx * 0.1 }}
                  >
                    {/* Encabezado de mes-año o solo separador para sin fecha */}
                    {group.year !== null && (
                      <div className="mb-10 relative">
                        <h2
                          className="text-2xl sm:text-3xl font-light tracking-wide relative inline-block"
                          style={{
                            color: '#5A6270',
                            fontFamily: "var(--font-handwritten), 'KGTeacherCreatedThinLined', Georgia, serif",
                            fontWeight: 400,
                            letterSpacing: '0.02em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          {group.label}
                        </h2>
                      </div>
                    )}

                    {/* Separador visual para sin fecha */}
                    {group.year === null && (
                      <div className="mb-10 py-6">
                        <div
                          className="h-px"
                          style={{
                            background: `linear-gradient(90deg, ${colors.subtitleColor}40 0%, ${colors.subtitleColor}20 50%, ${colors.subtitleColor}40 100%)`,
                          }}
                        />
                      </div>
                    )}

                    {/* Grilla de medios */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
                      {group.medios.map((item, idx) => (
                        <PolaroidPhoto
                          key={item.id}
                          item={item}
                          index={globalIndex + idx}
                          onClick={() => openViewer(globalIndex + idx)}
                        />
                      ))}
                    </div>
                  </motion.section>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {viewerOpen && (
          <FullscreenViewer
            media={flattenedAndSortedMedia}
            initialIndex={viewerIndex}
            autoPlay={viewerAutoPlay}
            onClose={() => {
              setViewerOpen(false)
              setViewerAutoPlay(false)
            }}
          />
        )}
      </AnimatePresence>

      {album && (
        <AlbumOpeningTransition
          isOpen={isOpeningTransition}
          coverImage={album.coverImage}
          coverTitle={album.title}
          dominantColor={album.dominantColor}
          onComplete={() => setIsOpeningTransition(false)}
        />
      )}
    </div>
  )
}
