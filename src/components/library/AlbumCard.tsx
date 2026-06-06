'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import type { Album } from '@/types'

interface AlbumCardProps {
  album: Album
  index: number
}

function getAlbumColors(color: { h: number; s: number; l: number }) {
  const { h, s, l } = color
  return {
    cover: `hsl(${h} ${Math.min(s + 5, 45)}% ${Math.max(l - 5, 30)}%)`,
    coverLight: `hsl(${h} ${Math.min(s, 40)}% ${Math.min(l + 8, 45)}%)`,
    coverDark: `hsl(${h} ${Math.min(s + 10, 50)}% ${Math.max(l - 15, 20)}%)`,
    spine: `hsl(${h} ${Math.min(s + 10, 55)}% ${Math.max(l - 18, 18)}%)`,
    band: `hsl(${h} ${Math.max(s - 15, 20)}% ${Math.min(l + 40, 88)}%)`,
    bandBorder: `hsl(${h} ${Math.max(s - 10, 25)}% ${Math.min(l + 25, 70)}%)`,
    textDark: `hsl(${h} ${Math.min(s + 10, 40)}% ${Math.max(l - 25, 15)}%)`,
    textMuted: `hsl(${h} ${Math.min(s, 30)}% ${Math.max(l - 15, 25)}%)`,
  }
}

function BindingRings() {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-7 flex flex-col justify-between py-4 z-30 pointer-events-none">
      <div className="flex flex-col gap-2">
        {[0, 1].map((i) => (
          <div key={`top-${i}`} className="relative flex items-center justify-center">
            <div 
              className="w-5 h-5 rounded-full relative"
              style={{
                background: 'linear-gradient(135deg, #d4c4a8 0%, #b09878 25%, #8a7558 50%, #b09878 75%, #d4c4a8 100%)',
                boxShadow: '1px 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
              }}
            >
              <div 
                className="absolute inset-[4px] rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #3a3025 0%, #252018 100%)',
                  boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.7)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col gap-2">
        {[0, 1].map((i) => (
          <div key={`bottom-${i}`} className="relative flex items-center justify-center">
            <div 
              className="w-5 h-5 rounded-full relative"
              style={{
                background: 'linear-gradient(135deg, #d4c4a8 0%, #b09878 25%, #8a7558 50%, #b09878 75%, #d4c4a8 100%)',
                boxShadow: '1px 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
              }}
            >
              <div 
                className="absolute inset-[4px] rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #3a3025 0%, #252018 100%)',
                  boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.7)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AlbumCard({ album, index }: AlbumCardProps) {
  const router = useRouter()
  const hasVideo = album.media.some(m => m.type === 'video')
  const colors = getAlbumColors(album.dominantColor)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/album/${album.id}`)}
      className="cursor-pointer group"
    >
      <div className="relative pl-3.5">
        <div 
          className="relative aspect-[4/3] rounded-r-md rounded-l-sm overflow-hidden shadow-lg shadow-black/50 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/60"
          style={{ 
            background: `linear-gradient(145deg, ${colors.coverLight} 0%, ${colors.cover} 60%, ${colors.coverDark} 100%)`,
          }}
        >
          <BindingRings />
          
          <div 
            className="absolute left-0 top-0 bottom-0 w-7 z-20"
            style={{
              background: `linear-gradient(90deg, ${colors.spine} 0%, ${colors.coverDark} 100%)`,
              boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.4)',
            }}
          />
          
          <div className="absolute inset-0 left-7 flex flex-col">
            <div className="relative flex-1 overflow-hidden m-2 mb-0 rounded-t-sm">
              <img
                src={album.coverImage}
                alt={album.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              
              {hasVideo && (
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
              )}
            </div>
            
            <div 
              className="mx-2 mb-2 px-3 py-2 rounded-b-sm relative"
              style={{ 
                background: colors.band,
                borderTop: `2px solid ${colors.bandBorder}`,
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), 0 -1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3 
                className="text-xs sm:text-sm font-bold line-clamp-1 leading-tight text-balance relative z-10"
                style={{ color: colors.textDark }}
              >
                {album.title}
              </h3>
              <p 
                className="text-[10px] sm:text-xs mt-0.5 relative z-10"
                style={{ color: colors.textMuted }}
              >
                {album.mediaCount} fotos &middot; {album.year}
              </p>
            </div>
          </div>
          
          <div 
            className="absolute right-2 top-0 bottom-0 w-1.5 z-20 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${colors.coverDark}80 0%, ${colors.cover}60 50%, ${colors.coverDark}80 100%)`,
              boxShadow: 'inset 0 0 3px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
    </motion.article>
  )
}
