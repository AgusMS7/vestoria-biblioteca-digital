import { getDriveClient } from '@/lib/google-drive'
import { mapToMediaItem, isMediaFile, isCoverFile } from '@/lib/google-drive/mapper'
import { extractYearMonthFromMetadata } from '@/lib/google-drive/date-extractor'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params

  try {
    const drive = getDriveClient()

    // Obtener archivos
    const filesResponse = await drive.files.list({
      q: `'${albumId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, modifiedTime)',
      pageSize: 50,
      orderBy: 'name',
    })

    const files = filesResponse.data.files || []

    // Auditar cada archivo
    const audit = files.slice(0, 20).map((file) => {
      const name = file.name || ''
      const mimeType = file.mimeType || ''
      const modifiedTime = file.modifiedTime
      const fileId = file.id

      // Extraer usando la función real
      const dateInfo = extractYearMonthFromMetadata(name, modifiedTime || undefined)

      // Analizar modifiedTime
      let modifiedDate = null
      if (modifiedTime) {
        try {
          const d = new Date(modifiedTime)
          modifiedDate = {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            date: d.toISOString().split('T')[0],
          }
        } catch (e) {
          modifiedDate = { error: 'invalid date' }
        }
      }

      // Buscar patrones en nombre
      const yearInName = name.match(/20\d{2}/)
      const fullDateInName = name.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/)

      return {
        fileId,
        filename: name,
        mimeType,
        isMedia: isMediaFile(mimeType),
        isCover: isCoverFile(name),
        // Fuentes de fecha
        modifiedTime: modifiedDate,
        yearPattern: yearInName ? yearInName[0] : null,
        fullDatePattern: fullDateInName
          ? {
              year: fullDateInName[1],
              month: fullDateInName[2],
              day: fullDateInName[3],
            }
          : null,
        // Resultado final
        extracted: dateInfo,
      }
    })

    return Response.json({
      albumId,
      totalFiles: files.length,
      auditedFiles: audit.length,
      audit,
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
