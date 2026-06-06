export const runtime = 'nodejs'

import { getMedia } from '@/lib/google-drive'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'Album ID is required',
        },
        { status: 400 }
      )
    }

    const media = await getMedia(id)

    return Response.json({
      success: true,
      data: media,
    })
  } catch (error) {
    console.error(`API /albums/[id]/media error:`, error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch media',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
