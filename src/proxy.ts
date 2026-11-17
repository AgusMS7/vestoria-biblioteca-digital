import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/config/env'

/**
 * Basic Auth opcional. Solo interviene si SITE_AUTH_USER y SITE_AUTH_PASS
 * están definidas; sin ellas deja pasar todo sin tocar la request.
 */
export function proxy(request: NextRequest) {
  const user = env.auth.user
  const pass = env.auth.pass

  if (!user || !pass) {
    return NextResponse.next()
  }

  if (safeEqual(request.headers.get('authorization'), encodeBasic(user, pass))) {
    return NextResponse.next()
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Vestoria", charset="UTF-8"',
    },
  })
}

/**
 * Codifica `usuario:contraseña` como Basic Auth en UTF-8.
 * `btoa` solo acepta latin1, así que se arma la cadena binaria a mano.
 */
function encodeBasic(user: string, pass: string): string {
  const bytes = new TextEncoder().encode(`${user}:${pass}`)

  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return `Basic ${btoa(binary)}`
}

/** Comparación en tiempo constante sobre el contenido de las credenciales. */
function safeEqual(received: string | null, expected: string): boolean {
  if (received === null || received.length !== expected.length) {
    return false
  }

  let diff = 0
  for (let i = 0; i < received.length; i++) {
    diff |= received.charCodeAt(i) ^ expected.charCodeAt(i)
  }

  return diff === 0
}

export const config = {
  // Protege la app y las APIs. Quedan fuera los assets estáticos del build
  // (_next/static, _next/image) y los de public/ (svg, json, fuentes, etc.).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|ttf|otf|woff|woff2)$).*)',
  ],
}
