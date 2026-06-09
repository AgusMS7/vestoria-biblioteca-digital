'use client'

import { motion } from 'framer-motion'
import { useEffect } from 'react'

interface AlbumOpeningTransitionProps {
  isOpen: boolean
  coverImage: string
  coverTitle: string
  dominantColor: { h: number; s: number; l: number }
  onComplete?: () => void
}

export function AlbumOpeningTransition({
  isOpen,
  coverImage,
  coverTitle,
  dominantColor,
  onComplete,
}: AlbumOpeningTransitionProps) {
  const backgroundColor = `hsl(${dominantColor.h} ${dominantColor.s}% ${Math.max(dominantColor.l - 15, 15)}%)`

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      onComplete?.()
    }, 600)

    return () => clearTimeout(timer)
  }, [isOpen, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {/* Subtle background transition */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor,
        }}
        animate={{
          opacity: isOpen ? 0.85 : 0,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Cover card expanding */}
      <motion.div
        initial={{
          scale: 0.8,
          opacity: 0,
          y: 40,
        }}
        animate={{
          scale: isOpen ? 1.1 : 0.8,
          opacity: isOpen ? 1 : 0,
          y: isOpen ? 0 : 40,
        }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '280px',
            height: '360px',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.6)',
            position: 'relative',
          }}
        >
          {/* Image */}
          <img
            src={coverImage}
            alt={coverTitle}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />

          {/* Gradient overlay for depth */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 40%, rgba(0, 0, 0, 0.2) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Bottom fade for title readability */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80px',
              background:
                'linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '16px',
            }}
            animate={{
              opacity: isOpen ? 1 : 0.7,
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <p
              style={{
                color: '#f5f0e8',
                fontSize: '16px',
                fontWeight: 500,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              {coverTitle}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Page turning effect suggestion (subtle lines) */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
        animate={{
          opacity: isOpen ? 0 : 0.3,
        }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Left page edge */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '1px',
            height: '400px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
