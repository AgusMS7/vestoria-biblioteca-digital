export const runtime = 'nodejs'

import { getAlbums, isDriveNotFoundError, isValidDriveId } from '@/lib/google-drive'
import {
  CATALOG_CACHE_CONTROL,
  ERROR_CACHE_CONTROL,
} from '@/lib/http/cache-control'

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
        { status: 400, headers: { 'Cache-Control': ERROR_CACHE_CONTROL } }
      )
    }

    if (!isValidDriveId(id)) {
      return Response.json(
        {
          success: false,
          error: 'Invalid category ID',
        },
        { status: 400, headers: { 'Cache-Control': ERROR_CACHE_CONTROL } }
      )
    }

    const albums = await getAlbums(id)

    return Response.json(
      {
        success: true,
        data: albums,
      },
      { headers: { 'Cache-Control': CATALOG_CACHE_CONTROL } }
    )
  } catch (error) {
    console.error(`API /categories/[id]/albums error:`, error)

    if (isDriveNotFoundError(error)) {
      return Response.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404, headers: { 'Cache-Control': ERROR_CACHE_CONTROL } }
      )
    }

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch albums',
      },
      { status: 500, headers: { 'Cache-Control': ERROR_CACHE_CONTROL } }
    )
  }
}
