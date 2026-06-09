import { getDriveClient } from '@/lib/google-drive'

export const runtime = 'nodejs'

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

function streamToBuffer(stream: any): Promise<Buffer> {
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
    const totalSize = Number.parseInt(fileMetadata.data.size || '', 10)
    const rangeHeader = _request.headers.get('range')
    const supportsRange = Number.isFinite(totalSize) && totalSize > 0

    let status = 200
    let start = 0
    let end = supportsRange ? totalSize - 1 : 0
    const responseHeaders: Record<string, string> = {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
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
            'Access-Control-Allow-Origin': '*',
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

    const buffer = await streamToBuffer(mediaResponse.data as any)

    if (!responseHeaders['Content-Length']) {
      responseHeaders['Content-Length'] = String(buffer.length)
    }

    return new Response(new Uint8Array(buffer), {
      status,
      headers: responseHeaders,
    })
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
