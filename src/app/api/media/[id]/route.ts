import { getDriveClient } from '@/lib/google-drive'

export const runtime = 'nodejs'

/**
 * GET /api/media/[id]
 *
 * Sirve el archivo multimedia completo desde Google Drive
 * Implementa streaming para imágenes y videos
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params

  if (!fileId) {
    return new Response('File ID is required', { status: 400 })
  }

  try {
    const drive = getDriveClient()

    // Obtener metadatos del archivo
    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'id, mimeType, name, size',
    })

    if (!fileMetadata.data.id) {
      return new Response('File not found', { status: 404 })
    }

    const mimeType = fileMetadata.data.mimeType || 'application/octet-stream'
    const fileName = fileMetadata.data.name || 'media'
    const fileSize = fileMetadata.data.size

    // Obtener el contenido del archivo
    const mediaResponse = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    )

    // Convertir stream a Buffer para Response
    const chunks: Buffer[] = []
    const stream = mediaResponse.data as any

    // Crear función que retorna Promise
    const streamToBuffer = (): Promise<Response> => {
      return new Promise((resolve) => {
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })

        stream.on('end', () => {
          const buffer = Buffer.concat(chunks)

          resolve(
            new Response(new Uint8Array(buffer), {
              status: 200,
              headers: {
                'Content-Type': mimeType,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
              },
            })
          )
        })

        stream.on('error', (error: Error) => {
          console.error('Stream error:', error)
          resolve(
            new Response(
              JSON.stringify({ error: 'Failed to stream media' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
          )
        })
      })
    }

    return await streamToBuffer()
  } catch (error) {
    console.error('Error serving media:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to serve media',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
