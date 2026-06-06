export const runtime = 'nodejs'

import { getCategories } from '@/lib/google-drive'

export async function GET() {
  try {
    const categories = await getCategories()

    return Response.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('API /categories error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
