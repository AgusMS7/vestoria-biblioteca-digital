export const runtime = 'nodejs'

import { listFolderContents } from '@/lib/google-drive'

export async function GET() {
  try {
    const rootFolderId = process.env.GOOGLE_ROOT_FOLDER_ID

    if (!rootFolderId) {
      return Response.json(
        {
          success: false,
          error:
            'GOOGLE_ROOT_FOLDER_ID environment variable is not configured',
        },
        { status: 400 }
      )
    }

    const contents = await listFolderContents(rootFolderId)

    return Response.json({
      success: true,
      message: 'Successfully connected to Google Drive',
      rootFolderId,
      itemCount: contents.length,
      items: contents,
    })
  } catch (error) {
    console.error('Test Drive API error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: 'Failed to connect to Google Drive',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
