import { getDriveClient } from '@/lib/google-drive'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params

  try {
    const drive = getDriveClient()

    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, thumbnailLink, size',
    })

    if (!fileMetadata.data.id) {
      return Response.json({ error: 'File not found' }, { status: 404 })
    }

    const mimeType = fileMetadata.data.mimeType || 'unknown'
    const hasThumbnailLink = !!fileMetadata.data.thumbnailLink
    const isVideo = mimeType.startsWith('video/')
    const isImage = mimeType.startsWith('image/')

    let thumbnailStatus = 'unknown'
    let thumbnailUrl = null
    let resizedUrl = null

    if (hasThumbnailLink && fileMetadata.data.thumbnailLink) {
      thumbnailUrl = fileMetadata.data.thumbnailLink
      // Probar la URL modificada
      const sizeParam = 'w200-h200'
      resizedUrl = thumbnailUrl.replace(/=w?\d+.*$/, `=${sizeParam}`)

      // Intentar fetch de la URL resizedUrl
      try {
        const resp = await fetch(resizedUrl, { method: 'HEAD' })
        thumbnailStatus = `${resp.status} ${resp.statusText}`
      } catch (e) {
        thumbnailStatus = `Error fetching: ${e instanceof Error ? e.message : 'unknown'}`
      }
    }

    return Response.json({
      fileId,
      filename: fileMetadata.data.name,
      mimeType,
      isVideo,
      isImage,
      size: fileMetadata.data.size,
      hasThumbnailLink,
      thumbnailLink: thumbnailUrl,
      modifiedUrl: resizedUrl,
      fetchStatus: thumbnailStatus,
    })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to test thumbnail',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
