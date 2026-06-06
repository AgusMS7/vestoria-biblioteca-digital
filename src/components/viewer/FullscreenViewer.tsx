'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib'
import type { MediaItem } from '@/types'

interface FullscreenViewerProps {
  media: MediaItem[]
  initialIndex: number
  autoPlay?: boolean
  onClose: () => void
}

export function FullscreenViewer({ media, initialIndex, autoPlay = false, onClose }: FullscreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showControls, setShowControls] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentMedia = media[currentIndex]

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeout) clearTimeout(controlsTimeout)
    const timeout = setTimeout(() => setShowControls(false), 3000)
    setControlsTimeout(timeout)
  }, [controlsTimeout])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    hideControlsAfterDelay()
  }, [hideControlsAfterDelay])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length)
  }, [media.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
  }, [media.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === ' ') {
        e.preventDefault()
        if (currentMedia.type === 'video') {
          setIsPlaying(!isPlaying)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goNext, goPrev, currentMedia.type, isPlaying])

  useEffect(() => {
    if (!autoPlay || media.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [autoPlay, media.length])

  useEffect(() => {
    hideControlsAfterDelay()
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    if (isPlaying) {
      video.play()
    } else {
      video.pause()
    }
  }, [isPlaying])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
    setTouchStart(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black"
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.src}
              alt={currentMedia.title || ''}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentMedia.src}
              className="max-w-full max-h-full object-contain"
              controls={false}
              autoPlay={false}
              muted={isMuted}
              onClick={() => setIsPlaying(!isPlaying)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {media.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </button>
              </>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div>
                  {currentMedia.title && (
                    <h3 className="text-white text-lg sm:text-xl font-medium mb-1">
                      {currentMedia.title}
                    </h3>
                  )}
                  <p className="text-white/60 text-sm">
                    {currentIndex + 1} de {media.length}
                  </p>
                </div>

                {currentMedia.type === 'video' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {media.length > 1 && media.length <= 20 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      idx === currentIndex
                        ? "bg-white w-4"
                        : "bg-white/40 hover:bg-white/60"
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
