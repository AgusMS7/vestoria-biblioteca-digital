export const runtime = 'nodejs'

import { getCategories } from '@/lib/google-drive'
import { isGoogleConfigured } from '@/config/env'

export async function GET() {
  try {
    const categories = await getCategories()

    return Response.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('API /categories error:', error)

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
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    )
  }
}
