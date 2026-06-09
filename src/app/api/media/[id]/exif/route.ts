import { getDriveClient } from '@/lib/google-drive'
import { getExifDateCached } from '@/lib/google-drive/exif-extractor'

export const runtime = 'nodejs'

interface ExifResponse {
  fileId: string
  filename: string
  exifFound: boolean
  year?: number
  month?: number
  day?: number
  source?: string
  confidence?: string
  note?: string
}

/**
 * GET /api/media/[id]/exif
 * 
 * Extrae metadata EXIF real de un archivo multimedia.
 * Esta operación es más lenta (descarga el archivo) pero proporciona
 * la fecha más precisa del recuerdo.
 * 
 * El resultado se cachea en memoria para evitar re-extracciones.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params

  try {
    const drive = getDriveClient()

    // Obtener metadatos del archivo
    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size',
    })

    if (!fileMetadata.data.id) {
      return Response.json({ error: 'File not found' }, { status: 404 })
    }

    const filename = fileMetadata.data.name || 'unknown'
    const mimeType = fileMetadata.data.mimeType || 'application/octet-stream'
    const fileSize = fileMetadata.data.size ? parseInt(fileMetadata.data.size) : 0

    // Solo procesar imágenes por ahora (videos podrían ser muy grandes)
    if (!mimeType.startsWith('image/')) {
      return Response.json(
        {
          fileId,
          filename,
          exifFound: false,
          note: 'EXIF extraction only supported for images',
        },
        { status: 400 }
      )
    }

    // Limitar tamaño máximo (evitar descargar archivos enormes)
    const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
    if (fileSize > MAX_SIZE) {
      return Response.json(
        {
          fileId,
          filename,
          exifFound: false,
          note: `File too large (${Math.round(fileSize / 1024 / 1024)}MB > 50MB limit)`,
        },
        { status: 413 }
      )
    }

    // Descargar archivo
    const mediaResponse = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    )

    // Convertir stream a buffer
    const chunks: Buffer[] = []
    const stream = mediaResponse.data as any

    return new Promise((resolve) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks)

          // Extraer EXIF usando el extractor cacheado
          const exifInfo = await getExifDateCached(buffer, mimeType, fileId)

          if (exifInfo) {
            resolve(
              new Response(
                JSON.stringify({
                  fileId,
                  filename,
                  exifFound: true,
                  year: exifInfo.year,
                  month: exifInfo.month,
                  day: exifInfo.day,
                  source: exifInfo.source,
                  confidence: exifInfo.confidence,
                }),
                { headers: { 'Content-Type': 'application/json' } }
              )
            )
          } else {
            resolve(
              new Response(
                JSON.stringify({
                  fileId,
                  filename,
                  exifFound: false,
                  note: 'No EXIF date found in file',
                }),
                { headers: { 'Content-Type': 'application/json' } }
              )
            )
          }
        } catch (error) {
          resolve(
            new Response(
              JSON.stringify({
                fileId,
                filename,
                exifFound: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
          )
        }
      })

      stream.on('error', (error: Error) => {
        resolve(
          new Response(
            JSON.stringify({
              fileId,
              filename,
              exifFound: false,
              error: error.message,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        )
      })
    }) as Promise<Response>
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to extract EXIF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
