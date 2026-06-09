'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import lottie from 'lottie-web'

interface LoadingOverlayProps {
  isVisible: boolean
  animationData?: string // Path to animation JSON
}

export function LoadingOverlay({ isVisible, animationData = '/book-loading.json' }: LoadingOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<any>(null)

  useEffect(() => {
    if (!isVisible || !containerRef.current) return

    // Initialize Lottie animation
    if (!animationRef.current) {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animationData,
      })
    } else {
      animationRef.current.play()
    }

    return () => {
      // Pause animation when not visible
      if (animationRef.current) {
        animationRef.current.pause()
      }
    }
  }, [isVisible, animationData])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-auto"
          style={{
            zIndex: 9999,
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Prevent scroll while loading */}
          <style>
            {`
              body {
                overflow: hidden !important;
              }
            `}
          </style>

          {/* Animation container */}
          <div
            className="relative w-40 h-40 sm:w-48 sm:h-48"
            ref={containerRef}
            style={{
              filter: 'drop-shadow(0 8px 24px rgba(139, 115, 85, 0.3))',
            }}
          />

          {/* Click/touch targets are blocked */}
          <div
            className="absolute inset-0 cursor-not-allowed"
            onClick={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
