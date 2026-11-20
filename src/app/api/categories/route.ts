export const runtime = 'nodejs'

import { getCategories } from '@/lib/google-drive'
import { isGoogleConfigured } from '@/config/env'
import {
  CATALOG_CACHE_CONTROL,
  ERROR_CACHE_CONTROL,
} from '@/lib/http/cache-control'

export async function GET() {
  try {
    const categories = await getCategories()

    return Response.json(
      {
        success: true,
        data: categories,
      },
      { headers: { 'Cache-Control': CATALOG_CACHE_CONTROL } }
    )
  } catch (error) {
    console.error('API /categories error:', error)

    if (!isGoogleConfigured()) {
      return Response.json(
        {
          success: false,
          error: 'Service unavailable',
          code: 'CONFIG_MISSING',
        },
        { status: 503, headers: { 'Cache-Control': ERROR_CACHE_CONTROL } }
      )
    }

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500, headers: { 'Cache-Control': ERROR_CACHE_CONTROL } }
    )
  }
}
