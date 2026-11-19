export const runtime = 'nodejs'

import { getAlbums, isDriveNotFoundError, isValidDriveId } from '@/lib/google-drive'

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

    if (!isValidDriveId(id)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid category ID',
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

    if (isDriveNotFoundError(error)) {
      return Response.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch albums',
      },
      { status: 500 }
    )
  }
}
