import { getDriveClient } from '@/lib/google-drive'

export const runtime = 'nodejs'

interface VideoAudit {
  fileId: string
  filename: string
  mimeType: string
  videoMediaMetadata: any
  hasThumbnailLink: boolean
  thumbnailLink: string | null
  canGenerateThumbnail: boolean
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params

  try {
    const drive = getDriveClient()

    // Obtener solo videos del album
    const filesResponse = await drive.files.list({
      q: `'${albumId}' in parents and mimeType contains 'video/' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, videoMediaMetadata, thumbnailLink, size)',
      pageSize: 100,
      orderBy: 'name',
    })

    const videos = filesResponse.data.files || []

    // Auditar cada video
    const audits: VideoAudit[] = videos.map((file) => {
      const hasThumbnailLink = !!file.thumbnailLink
      const hasVideoMetadata = !!file.videoMediaMetadata
      const hasData = !!file.videoMediaMetadata?.durationMillis

      return {
        fileId: file.id || 'unknown',
        filename: file.name || 'unknown',
        mimeType: file.mimeType || 'unknown',
        videoMediaMetadata: file.videoMediaMetadata
          ? {
              width: file.videoMediaMetadata.width,
              height: file.videoMediaMetadata.height,
              durationMillis: file.videoMediaMetadata.durationMillis,
            }
          : null,
        hasThumbnailLink,
        thumbnailLink: file.thumbnailLink || null,
        canGenerateThumbnail: hasVideoMetadata && hasData,
      }
    })

    // Estadísticas
    const stats = {
      totalVideos: audits.length,
      withThumbnailLink: audits.filter((a) => a.hasThumbnailLink).length,
      withoutThumbnailLink: audits.filter((a) => !a.hasThumbnailLink).length,
      withVideoMetadata: audits.filter((a) => a.videoMediaMetadata).length,
      canGenerateThumbnail: audits.filter((a) => a.canGenerateThumbnail).length,
    }

    const percentages = {
      withThumbnail: audits.length > 0 ? ((stats.withThumbnailLink / audits.length) * 100).toFixed(1) : '0.0',
      withoutThumbnail: audits.length > 0 ? ((stats.withoutThumbnailLink / audits.length) * 100).toFixed(1) : '0.0',
      canGenerate:
        audits.length > 0 ? ((stats.canGenerateThumbnail / audits.length) * 100).toFixed(1) : '0.0',
    }

    const recommendation =
      parseInt(percentages.withThumbnail) >= 70
        ? 'GOOD: Most videos have thumbnailLink from Google Drive'
        : parseInt(percentages.withThumbnail) >= 30
          ? 'PARTIAL: Some videos have thumbnails, fallback needed for others'
          : 'CRITICAL: Most videos missing thumbnailLink. Implement frame extraction.'

    return Response.json({
      albumId,
      timestamp: new Date().toISOString(),
      stats,
      percentages,
      audits: audits.slice(0, 20), // Primeros 20 videos
      totalAudited: audits.length,
      recommendation,
    })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to audit video thumbnails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
