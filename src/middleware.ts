import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/config/env'

/**
 * Basic Auth opcional. Solo interviene si SITE_AUTH_USER y SITE_AUTH_PASS
 * están definidas; sin ellas deja pasar todo sin tocar la request.
 */
export function middleware(request: NextRequest) {
  const user = env.auth.user
  const pass = env.auth.pass

  if (!user || !pass) {
    return NextResponse.next()
  }

  const expected = `Basic ${btoa(`${user}:${pass}`)}`

  if (request.headers.get('authorization') === expected) {
    return NextResponse.next()
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Vestoria", charset="UTF-8"',
    },
  })
}

export const config = {
  // Protege la app y las API, dejando fuera los assets estáticos.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
