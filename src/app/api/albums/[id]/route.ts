export const runtime = 'nodejs'

import { getAlbum } from '@/lib/google-drive'

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

    const album = await getAlbum(id)

    if (!album) {
      return Response.json(
        {
          success: false,
          error: 'Album not found',
        },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: album,
    })
  } catch (error) {
    console.error(`API /albums/[id] error:`, error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch album',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
