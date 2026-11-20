import { getDriveClient, isDriveNotFoundError, isMediaFile, isValidDriveId } from '@/lib/google-drive'
import type { drive_v3 } from 'googleapis'
import type { Readable } from 'node:stream'
import sharp from 'sharp'

export const runtime = 'nodejs'

const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif'])

const MEDIA_CACHE_CONTROL =
  'public, max-age=3600, stale-while-revalidate=86400'

function parseRangeHeader(rangeHeader: string, totalSize: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())

  if (!match || totalSize <= 0) {
    return null
  }

  const [, startText, endText] = match

  if (!startText && !endText) {
    return null
  }

  if (!startText) {
    const suffixLength = Number.parseInt(endText, 10)

    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null
    }

    const start = Math.max(totalSize - suffixLength, 0)

    return { start, end: totalSize - 1 }
  }

  const start = Number.parseInt(startText, 10)

  if (!Number.isFinite(start) || start < 0 || start >= totalSize) {
    return null
  }

  const requestedEnd = endText ? Number.parseInt(endText, 10) : totalSize - 1

  if (!Number.isFinite(requestedEnd) || requestedEnd < start) {
    return null
  }

  return {
    start,
    end: Math.min(requestedEnd, totalSize - 1),
  }
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    stream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    stream.on('error', (error: Error) => {
      reject(error)
    })
  })
}

/**
 * Descarga el original, lo convierte a JPEG y, si sharp no puede decodificar
 * HEIC/HEIF, devuelve la miniatura de Drive en tamaño grande.
 */
async function serveConvertedImage(
  drive: drive_v3.Drive,
  fileId: string
): Promise<Response> {
  const headers = {
    'Content-Type': 'image/jpeg',
    'Cache-Control': MEDIA_CACHE_CONTROL,
  }

  try {
    const mediaResponse = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    )

    const original = await streamToBuffer(mediaResponse.data as Readable)
    const jpeg = await sharp(original).jpeg({ quality: 90 }).toBuffer()

    return new Response(new Uint8Array(jpeg), { status: 200, headers })
  } catch (error) {
    console.warn(
      `HEIC/HEIF conversion failed for ${fileId}; falling back to the drive thumbnail`,
      error
    )
  }

  const thumbnail = await fetchDriveThumbnail(drive, fileId)

  if (thumbnail) {
    return new Response(new Uint8Array(thumbnail), { status: 200, headers })
  }

  return new Response('Unsupported media type', { status: 415 })
}

async function fetchDriveThumbnail(
  drive: drive_v3.Drive,
  fileId: string
): Promise<Buffer | null> {
  const metadata = await drive.files.get({
    fileId,
    fields: 'thumbnailLink',
  })

  const thumbnailLink = metadata.data.thumbnailLink

  if (!thumbnailLink) {
    return null
  }

  const url = thumbnailLink.replace(/=[swh]\d+(?:-[swh]\d+)?/, '=w1600')

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Vestoria/1.0' },
    })

    if (!response.ok) {
      return null
    }

    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.warn(`Drive thumbnail fetch failed for ${fileId}`, error)
    return null
  }
}

/**
 * GET /api/media/[id]
 *
 * Sirve el archivo multimedia completo desde Google Drive
 * y responde a Range requests para permitir seek en el navegador.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params

  if (!fileId) {
    return new Response('File ID is required', { status: 400 })
  }

  if (!isValidDriveId(fileId)) {
    return new Response('Invalid file ID', { status: 400 })
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

    if (!isMediaFile(mimeType)) {
      return new Response('Unsupported media type', { status: 415 })
    }

    // HEIC/HEIF no se reproduce en la mayoría de los navegadores: se convierte
    // a JPEG (o se sirve la miniatura de Drive si sharp no puede decodificarlo).
    if (HEIC_MIME_TYPES.has(mimeType)) {
      return await serveConvertedImage(drive, fileId)
    }

    const totalSize = Number.parseInt(fileMetadata.data.size || '', 10)
    const rangeHeader = _request.headers.get('range')
    const supportsRange = Number.isFinite(totalSize) && totalSize > 0

    let status = 200
    let start = 0
    let end = supportsRange ? totalSize - 1 : 0
    const responseHeaders: Record<string, string> = {
      'Content-Type': mimeType,
      'Cache-Control': MEDIA_CACHE_CONTROL,
      'Accept-Ranges': 'bytes',
    }

    const mediaRequestOptions: Record<string, unknown> = {
      responseType: 'stream',
    }

    if (supportsRange && rangeHeader) {
      const parsedRange = parseRangeHeader(rangeHeader, totalSize)

      if (!parsedRange) {
        return new Response(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
            'Accept-Ranges': 'bytes',
          },
        })
      }

      start = parsedRange.start
      end = parsedRange.end
      status = 206
      responseHeaders['Content-Range'] = `bytes ${start}-${end}/${totalSize}`
      responseHeaders['Content-Length'] = String(end - start + 1)
      mediaRequestOptions.headers = {
        Range: `bytes=${start}-${end}`,
      }
    }

    // Obtener el contenido del archivo, limitado por Range cuando aplica.
    const mediaResponse = await drive.files.get(
      { fileId, alt: 'media' },
      mediaRequestOptions
    )

    const buffer = await streamToBuffer(mediaResponse.data as Readable)

    if (!responseHeaders['Content-Length']) {
      responseHeaders['Content-Length'] = String(buffer.length)
    }

    return new Response(new Uint8Array(buffer), {
      status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Error serving media:', error)

    if (isDriveNotFoundError(error)) {
      return new Response('File not found', { status: 404 })
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to serve media',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
