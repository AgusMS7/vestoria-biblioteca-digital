import { getDriveClient } from '@/lib/google-drive'
import { isMediaFile } from '@/lib/google-drive/mapper'

export const runtime = 'nodejs'

interface FileAudit {
  fileId: string
  filename: string
  mimeType: string
  size: number
  modifiedTime: string | null
  createdTime: string | null
  // Metadata disponible
  imageMediaMetadata: boolean
  videoMediaMetadata: boolean
  // Análisis de fecha
  hasDateInFilename: boolean
  datePatternFound: string | null
  modifiedYear: number | null
  createdYear: number | null
  canHaveExif: boolean
  exifEstimate: 'likely' | 'unlikely' | 'unknown'
}

function analyzeFileName(filename: string): {
  hasDate: boolean
  pattern: string | null
  year: number | null
} {
  // Patrón completo: YYYYMMDD
  const fullDateMatch = filename.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/)
  if (fullDateMatch) {
    return {
      hasDate: true,
      pattern: `${fullDateMatch[1]}-${fullDateMatch[2]}-${fullDateMatch[3]}`,
      year: parseInt(fullDateMatch[1]),
    }
  }

  // Año solo
  const yearMatch = filename.match(/19\d{2}|20\d{2}/)
  if (yearMatch) {
    return {
      hasDate: true,
      pattern: yearMatch[0],
      year: parseInt(yearMatch[0]),
    }
  }

  // Patrón de cámara: IMG_YYYYMMDD
  const cameraMatch = filename.match(/IMG[_-]?(\d{4})[_-]?(\d{2})[_-]?(\d{2})/i)
  if (cameraMatch) {
    return {
      hasDate: true,
      pattern: `camera-${cameraMatch[1]}-${cameraMatch[2]}-${cameraMatch[3]}`,
      year: parseInt(cameraMatch[1]),
    }
  }

  return {
    hasDate: false,
    pattern: null,
    year: null,
  }
}

function estimateExif(mimeType: string, filename: string): 'likely' | 'unlikely' | 'unknown' {
  // JPEG de cámaras típicamente tiene EXIF
  if (mimeType === 'image/jpeg') {
    // Si no tiene fecha en nombre, probablemente tiene EXIF
    if (!filename.match(/\d{4}/)) {
      return 'likely'
    }
    return 'unknown'
  }

  // PNG puede tener metadata but less common
  if (mimeType === 'image/png') {
    return 'unlikely'
  }

  // WebP, GIF: unlikely
  if (mimeType === 'image/webp' || mimeType === 'image/gif') {
    return 'unlikely'
  }

  return 'unknown'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params

  try {
    const drive = getDriveClient()

    // Obtener archivos del album
    const filesResponse = await drive.files.list({
      q: `'${albumId}' in parents and trashed=false`,
      spaces: 'drive',
      fields:
        'files(id, name, mimeType, size, modifiedTime, createdTime, imageMediaMetadata, videoMediaMetadata)',
      pageSize: 200,
      orderBy: 'name',
    })

    const files = filesResponse.data.files || []

    // Auditar cada archivo
    const audits: FileAudit[] = files.map((file) => {
      const mimeType = file.mimeType || 'unknown'
      const filename = file.name || 'unknown'
      const isImage = mimeType.startsWith('image/')
      const isVideo = mimeType.startsWith('video/')

      const dateAnalysis = analyzeFileName(filename)

      // Extraer años de timestamps
      let modifiedYear: number | null = null
      let createdYear: number | null = null

      if (file.modifiedTime) {
        try {
          modifiedYear = new Date(file.modifiedTime).getFullYear()
        } catch (e) {}
      }

      if (file.createdTime) {
        try {
          createdYear = new Date(file.createdTime).getFullYear()
        } catch (e) {}
      }

      return {
        fileId: file.id || 'unknown',
        filename,
        mimeType,
        size: file.size ? parseInt(file.size) : 0,
        modifiedTime: file.modifiedTime || null,
        createdTime: file.createdTime || null,
        imageMediaMetadata: !!file.imageMediaMetadata,
        videoMediaMetadata: !!file.videoMediaMetadata,
        hasDateInFilename: dateAnalysis.hasDate,
        datePatternFound: dateAnalysis.pattern,
        modifiedYear,
        createdYear,
        canHaveExif: isImage,
        exifEstimate: isImage ? estimateExif(mimeType, filename) : 'unlikely',
      }
    })

    // Calcular estadísticas
    const stats = {
      totalFiles: audits.length,
      byType: {
        images: audits.filter((a) => a.mimeType.startsWith('image/')).length,
        videos: audits.filter((a) => a.mimeType.startsWith('video/')).length,
        other: audits.filter(
          (a) => !a.mimeType.startsWith('image/') && !a.mimeType.startsWith('video/')
        ).length,
      },
      dateAvailability: {
        withDateInFilename: audits.filter((a) => a.hasDateInFilename).length,
        withoutDateInFilename: audits.filter((a) => !a.hasDateInFilename).length,
        // Estimar cuántos pueden tener EXIF
        canHaveExif: audits.filter((a) => a.canHaveExif).length,
        likelyHaveExif: audits.filter((a) => a.exifEstimate === 'likely').length,
        unlikelyHaveExif: audits.filter((a) => a.exifEstimate === 'unlikely').length,
      },
      dateDiscrepancies: {
        modifiedVsCreated: audits.filter(
          (a) => a.modifiedYear !== null && a.createdYear !== null && a.modifiedYear !== a.createdYear
        ).length,
        recentModified2026: audits.filter((a) => a.modifiedYear === 2026).length,
        olderFiles: audits.filter((a) => a.modifiedYear && a.modifiedYear < 2000).length,
      },
      videoThumbnails: {
        totalVideos: audits.filter((a) => a.mimeType.startsWith('video/')).length,
        // No podemos saber si tienen thumbnailLink sin hacer otra query
        note: 'Run /api/audit/video-thumbnails for detailed thumbnail analysis',
      },
    }

    // Convertir porcentajes
    const percentages = {
      dateInFilename: `${((stats.dateAvailability.withDateInFilename / audits.length) * 100).toFixed(1)}%`,
      canHaveExif: `${((stats.dateAvailability.canHaveExif / audits.length) * 100).toFixed(1)}%`,
      likelyExif: `${((stats.dateAvailability.likelyHaveExif / audits.length) * 100).toFixed(1)}%`,
      discrepancy: `${((stats.dateDiscrepancies.modifiedVsCreated / audits.length) * 100).toFixed(1)}%`,
      recent2026: `${((stats.dateDiscrepancies.recentModified2026 / audits.length) * 100).toFixed(1)}%`,
    }

    return Response.json({
      albumId,
      timestamp: new Date().toISOString(),
      stats,
      percentages,
      audits: audits.slice(0, 30), // Devolver solo primeros 30 para no saturar response
      totalAudited: audits.length,
      recommendation:
        percentages.dateInFilename === '0.0'
          ? 'CRITICAL: No files have dates in names. EXIF extraction required for accurate dating.'
          : percentages.likelyExif === '0.0'
            ? 'OK: All files have dates in names or metadata'
            : 'HYBRID: Some files have dates in names, some may need EXIF extraction',
    })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to audit album',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
