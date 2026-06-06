export const runtime = 'nodejs'

import { getAlbums } from '@/lib/google-drive'

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
          error: 'Category ID is required',
        },
        { status: 400 }
      )
    }

    const albums = await getAlbums(id)

    return Response.json({
      success: true,
      data: albums,
    })
  } catch (error) {
    console.error(`API /categories/[id]/albums error:`, error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch albums',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
