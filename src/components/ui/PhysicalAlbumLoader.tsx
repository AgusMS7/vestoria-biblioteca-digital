'use client'

import { motion } from 'framer-motion'
import styles from './PhysicalAlbumLoader.module.css'

export function PhysicalAlbumLoader() {
  const pageVariants = {
    initial: { rotateY: 0 },
    animate: {
      rotateY: [0, 180, 180, 360],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: [0.25, 0.46, 0.45, 0.94],
      } as any,
    },
  }

  const perspectiveStyle: React.CSSProperties = {
    perspective: '1200px',
  }

  const albumContainerStyle: React.CSSProperties = {
    width: '280px',
    height: '360px',
    position: 'relative',
    transformStyle: 'preserve-3d',
  }

  const coverStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#3d2817',
    borderRadius: '4px 12px 12px 4px',
    background: 'linear-gradient(135deg, #2d1f14 0%, #4a3422 50%, #2d1f14 100%)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset -2px 0 8px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transformStyle: 'preserve-3d',
    borderLeft: '3px solid #1a0f08',
  }

  const spinePaddingStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '16px',
    background: 'linear-gradient(to right, #1a0f08, #2d1f14, #3a2817)',
    borderRadius: '4px 0 0 4px',
  }

  return (
    <div style={perspectiveStyle} className="flex items-center justify-center min-h-screen">
      <div style={{ textAlign: 'center' }}>
        <div style={albumContainerStyle}>
          <div style={spinePaddingStyle} />
          
          <motion.div
            style={coverStyle}
            variants={pageVariants}
            initial="initial"
            animate="animate"
          >
            {/* Page flip animation using pseudo-element simulation */}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Animated pages effect */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '90%',
                  height: '90%',
                  backgroundColor: '#f5f0e8',
                  borderRadius: '2px',
                  boxShadow:
                    'inset 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 -1px 2px rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                animate={{
                  scaleX: [1, 0, 0, 1],
                }}
                transition={{
                  duration: 3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  repeat: Infinity,
                }}
              >
                {/* Page content - subtle text/icon */}
                <div
                  style={{
                    textAlign: 'center',
                    opacity: 0.3,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: '48px',
                      marginBottom: '12px',
                      color: '#4a3422',
                    }}
                  >
                    📖
                  </div>
                  <p
                    style={{
                      color: '#2d1f14',
                      fontSize: '12px',
                      fontFamily: 'Georgia, serif',
                      letterSpacing: '0.1em',
                      marginTop: '8px',
                    }}
                  >
                    ÁLBUM
                  </p>
                </div>
              </motion.div>

              {/* Empty page state on flip */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '90%',
                  height: '90%',
                  backgroundColor: '#fffbf5',
                  borderRadius: '2px',
                  boxShadow:
                    'inset 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 -1px 2px rgba(255, 255, 255, 0.8)',
                }}
                animate={{
                  scaleX: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  repeat: Infinity,
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Subtle loading text below */}
        <motion.p
          style={{
            marginTop: '40px',
            color: '#c9a882',
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Abriendo recuerdos...
        </motion.p>
      </div>
    </div>
  )
}
