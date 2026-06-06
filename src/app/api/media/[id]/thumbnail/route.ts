import { getDriveClient } from '@/lib/google-drive'
import sharp from 'sharp'

export const runtime = 'nodejs'

// Caché en memoria para thumbnails procesadas
const thumbnailCache = new Map<string, Buffer>()

/**
 * GET /api/media/[id]/thumbnail
 *
 * Sirve miniaturas optimizadas usando:
 * 1. thumbnailLink de Google Drive si existe
 * 2. Si no, comprime el archivo original con sharp
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params
  const url = new URL(request.url)
  const size = url.searchParams.get('size') || 'small'

  if (!fileId) {
    return new Response('File ID is required', { status: 400 })
  }

  // Generar clave de caché única por tipo de archivo
  const cacheKey = `${fileId}_${size}`

  // Verificar caché
  if (thumbnailCache.has(cacheKey)) {
    const buffer = thumbnailCache.get(cacheKey)!
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    const drive = getDriveClient()

    // Obtener metadatos
    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'id, mimeType, thumbnailLink, imageMediaMetadata, videoMediaMetadata',
    })

    if (!fileMetadata.data.id) {
      return new Response('File not found', { status: 404 })
    }

    const mimeType = fileMetadata.data.mimeType || 'application/octet-stream'
    const isImage = mimeType.startsWith('image/')
    const isVideo = mimeType.startsWith('video/')

    // Para vídeos: retornar siempre placeholder gris (no usar thumbnailLink verde)
    if (isVideo) {
      const grayPngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      const buffer = Buffer.from(grayPngBase64, 'base64')
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'no-cache, public, must-revalidate, max-age=0',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Intentar usar thumbnailLink de Google Drive (solo para imágenes)
    if (fileMetadata.data.thumbnailLink) {
      const thumbnailUrl = fileMetadata.data.thumbnailLink

      // Modificar tamaño
      const sizeMap: Record<string, number> = {
        small: 200,
        medium: 400,
        large: 800,
      }
      const dimension = sizeMap[size] || 200
      const resizedUrl = `${thumbnailUrl}=w${dimension}-h${dimension}`

      try {
        const thumbnailResponse = await fetch(resizedUrl, {
          headers: { 'User-Agent': 'Vestoria/1.0' },
        })

        if (thumbnailResponse.ok) {
          const thumbnailBuffer = await thumbnailResponse.arrayBuffer()
          const buffer = Buffer.from(thumbnailBuffer)

          // Guardar en caché
          thumbnailCache.set(cacheKey, buffer)

          // Limpiar caché si crece demasiado (máximo 100 entradas)
          if (thumbnailCache.size > 100) {
            const firstKey = thumbnailCache.keys().next().value
            if (firstKey) thumbnailCache.delete(firstKey)
          }

          return new Response(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': 'image/jpeg',
              'Content-Length': buffer.length.toString(),
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
            },
          })
        }
      } catch (error) {
        console.error('Error fetching thumbnailLink:', error)
        // Continuar con compresión local
      }
    }

    // Si no hay thumbnailLink o falló, comprimir localmente
    if (isImage) {
      const mediaResponse = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      )

      const chunks: Buffer[] = []

      const streamToBuffer = (): Promise<Response> => {
        return new Promise((resolve) => {
          const stream = mediaResponse.data as any

          stream.on('data', (chunk: Buffer) => {
            chunks.push(chunk)
          })

          stream.on('end', async () => {
            try {
              const originalBuffer = Buffer.concat(chunks)

              // Comprimir con sharp
              const sizeMap: Record<string, number> = {
                small: 200,
                medium: 400,
                large: 800,
              }
              const dimension = sizeMap[size] || 200

              const compressedBuffer = await sharp(originalBuffer)
                .resize(dimension, dimension, {
                  fit: 'cover',
                  position: 'center',
                })
                .jpeg({ quality: 80, progressive: true })
                .toBuffer()

              // Guardar en caché
              thumbnailCache.set(cacheKey, compressedBuffer)

              // Limpiar caché si crece demasiado
              if (thumbnailCache.size > 100) {
                const firstKey = thumbnailCache.keys().next().value
                if (firstKey) thumbnailCache.delete(firstKey)
              }

              resolve(
                new Response(new Uint8Array(compressedBuffer), {
                  status: 200,
                  headers: {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': compressedBuffer.length.toString(),
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                  },
                })
              )
            } catch (error) {
              console.error('Sharp compression error:', error)
              // Fallback: devolver imagen original comprimida
              const fallbackBuffer = Buffer.concat(chunks)
              resolve(
                new Response(new Uint8Array(fallbackBuffer), {
                  status: 200,
                  headers: {
                    'Content-Type': mimeType,
                    'Content-Length': fallbackBuffer.length.toString(),
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                  },
                })
              )
            }
          })

          stream.on('error', (error: Error) => {
            console.error('Stream error:', error)
            resolve(new Response('Failed to process image', { status: 500 }))
          })
        })
      }

      return await streamToBuffer()
    }

    return new Response('Unsupported file type', { status: 400 })
  } catch (error) {
    console.error('Error serving thumbnail:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to serve thumbnail',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
