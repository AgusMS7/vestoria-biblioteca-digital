export const runtime = 'nodejs'

import { getAlbum, isDriveNotFoundError, isValidDriveId } from '@/lib/google-drive'
import { isGoogleConfigured } from '@/config/env'

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

    if (!isValidDriveId(id)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid album ID',
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

    if (isDriveNotFoundError(error)) {
      return Response.json(
        {
          success: false,
          error: 'Album not found',
        },
        { status: 404 }
      )
    }

    if (!isGoogleConfigured()) {
      return Response.json(
        {
          success: false,
          error: 'Service unavailable',
          code: 'CONFIG_MISSING',
        },
        { status: 503 }
      )
    }

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch album',
      },
      { status: 500 }
    )
  }
}
