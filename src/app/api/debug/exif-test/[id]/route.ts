import { getDriveClient } from '@/lib/google-drive'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params

  try {
    const drive = getDriveClient()

    // Intentar obtener archivo con metadata extendida
    const response = await drive.files.get({
      fileId,
      fields: `id, name, mimeType, modifiedTime, createdTime, 
               imageMediaMetadata, 
               videoMediaMetadata,
               webContentLink,
               exifData`,
    })

    // Intentar con diferentes campos
    const response2 = await drive.files.get({
      fileId,
      fields: '*',
    })

    return Response.json({
      file1: response.data,
      file2_keys: Object.keys(response2.data),
    })
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to test EXIF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
