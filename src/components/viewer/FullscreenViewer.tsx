'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  RotateCw,
  RotateCcw,
  ZoomIn,
  Presentation,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { cn } from '@/lib'
import type { Media } from '@/types'

interface FullscreenViewerProps {
  media: Media[]
  initialIndex: number
  autoPlay?: boolean
  onClose: () => void
}

export function FullscreenViewer({
  media,
  initialIndex,
  autoPlay = false,
  onClose,
}: FullscreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<
    ReturnType<typeof setTimeout> | null
  >(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [preloadedImages, setPreloadedImages] = useState<Record<string, boolean>>(
    {}
  )

  // Image-specific state
  const [rotation, setRotation] = useState(0)
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain')
  const [zoom, setZoom] = useState(1)

  // Video-specific state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoVolume, setVideoVolume] = useState(1)
  const [isSlideshow, setIsSlideshow] = useState(autoPlay)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentMedia = media[currentIndex]

  // Preload adjacent images for faster navigation
  useEffect(() => {
    const indicesToPreload = [currentIndex - 1, currentIndex, currentIndex + 1].filter(
      (idx) => idx >= 0 && idx < media.length
    )

    indicesToPreload.forEach((idx) => {
      const m = media[idx]
      if (m.type === 'image' && !preloadedImages[m.id]) {
        const img = new Image()
        img.onload = () => {
          setPreloadedImages((prev) => ({ ...prev, [m.id]: true }))
        }
        img.src = m.mediaUrl
      }
    })
  }, [currentIndex, media, preloadedImages])

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
    setRotation(0)
    setFitMode('contain')
    setZoom(1)
    setIsVideoPlaying(false)
    setVideoCurrentTime(0)
  }, [media.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
    setRotation(0)
    setFitMode('contain')
    setZoom(1)
    setIsVideoPlaying(false)
    setVideoCurrentTime(0)
  }, [media.length])

  // Slideshow: advances to next media after 6 seconds
  useEffect(() => {
    if (!isSlideshow || media.length <= 1) return

    const interval = setInterval(() => {
      goNext()
    }, 6000)

    return () => clearInterval(interval)
  }, [isSlideshow, media.length, goNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === ' ') {
        e.preventDefault()
        if (currentMedia.type === 'video') {
          setIsVideoPlaying(!isVideoPlaying)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goNext, goPrev, currentMedia.type, isVideoPlaying])

  // Video playback control
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isVideoPlaying) {
      video.play().catch(() => {
        setIsVideoPlaying(false)
      })
    } else {
      video.pause()
    }
  }, [isVideoPlaying])

  // Video volume control
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.volume = videoVolume
    }
  }, [videoVolume])

  // Sync video time updates
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setVideoCurrentTime(video.currentTime)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [])

  // Update video current time when slider changes
  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setVideoCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const skipVideo = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoDuration, videoRef.current.currentTime + seconds))
      videoRef.current.currentTime = newTime
      setVideoCurrentTime(newTime)
    }
  }

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
      ref={containerRef}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.mediaUrl}
              alt={currentMedia.title || ''}
              className="select-none"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: fitMode,
                objectPosition: 'center',
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease-out',
              }}
            />
          ) : (
            <video
              ref={videoRef}
              src={currentMedia.mediaUrl}
              className="select-none"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: fitMode,
                objectPosition: 'center',
                transform: `scale(${zoom})`,
              }}
              onLoadedMetadata={(e) => {
                setVideoDuration(e.currentTarget.duration)
              }}
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
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors z-10 cursor-pointer"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Presentation button (below close, only for images) */}
            {currentMedia.type === 'image' && (
              <button
                onClick={() => setIsSlideshow(!isSlideshow)}
                className="absolute top-20 right-4 sm:top-24 sm:right-6 p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors z-10 cursor-pointer"
                title={isSlideshow ? 'Detener presentación' : 'Iniciar presentación'}
              >
                {isSlideshow ? (
                  <Square className="w-6 h-6 text-white" />
                ) : (
                  <Presentation className="w-6 h-6 text-white" />
                )}
              </button>
            )}

            {/* Navigation buttons */}
            {media.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}

            {/* Bottom info and image controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
              <div className="max-w-4xl mx-auto">
                {/* File info */}
                <div className="mb-6">
                  {currentMedia.title && (
                    <h3 className="text-white text-lg sm:text-xl font-medium mb-1">
                      {currentMedia.fileName}
                    </h3>
                  )}
                  <p className="text-white/60 text-sm">
                    {currentIndex + 1} de {media.length}
                  </p>
                </div>

                {/* Image controls (for images only) */}
                {currentMedia.type === 'image' && (
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                      title="Rotar derecha"
                    >
                      <RotateCw className="w-6 h-6 text-white" />
                    </button>

                    <button
                      onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                      className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                      title="Rotar izquierda"
                    >
                      <RotateCcw className="w-6 h-6 text-white" />
                    </button>

                    <button
                      onClick={() => setZoom((z) => (z === 1 ? 1.5 : 1))}
                      className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                      title="Zoom"
                    >
                      <ZoomIn className="w-6 h-6 text-white" />
                    </button>

                    <button
                      onClick={() =>
                        setFitMode((mode) => (mode === 'contain' ? 'cover' : 'contain'))
                      }
                      className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                      title="Ajustar"
                    >
                      <Maximize className="w-6 h-6 text-white" />
                    </button>
                  </div>
                )}

                {/* Video controls */}
                {currentMedia.type === 'video' && (
                  <div className="space-y-4">
                    {/* Timeline */}
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-xs min-w-[35px]">
                        {Math.floor(videoCurrentTime)}s
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration || 0}
                        value={videoCurrentTime}
                        onChange={handleTimelineChange}
                        className="flex-1 h-2 bg-white/20 rounded cursor-pointer accent-white"
                      />
                      <span className="text-white/60 text-xs min-w-[35px] text-right">
                        {Math.floor(videoDuration)}s
                      </span>
                    </div>

                    {/* Play controls and volume in same line */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => skipVideo(-5)}
                        className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                        title="Retroceder 5s"
                      >
                        <SkipBack className="w-6 h-6 text-white" />
                      </button>

                      <button
                        onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                        className="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer"
                        title={isVideoPlaying ? 'Pausar' : 'Reproducir'}
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-7 h-7 text-white" />
                        ) : (
                          <Play className="w-7 h-7 text-white" />
                        )}
                      </button>

                      <button
                        onClick={() => skipVideo(5)}
                        className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                        title="Avanzar 5s"
                      >
                        <SkipForward className="w-6 h-6 text-white" />
                      </button>

                      <div className="flex items-center gap-2 ml-6">
                        <Volume2 className="w-5 h-5 text-white/60 flex-shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={videoVolume}
                          onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
                          className="w-20 h-2 bg-white/20 rounded cursor-pointer accent-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails indicator */}
            {media.length > 1 && media.length <= 20 && (
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx)
                      setRotation(0)
                      setFitMode('contain')
                      setZoom(1)
                      setIsVideoPlaying(false)
                      setVideoCurrentTime(0)
                    }}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all cursor-pointer',
                      idx === currentIndex
                        ? 'bg-white w-4'
                        : 'bg-white/40 hover:bg-white/60'
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
