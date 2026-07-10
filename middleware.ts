import { NextRequest, NextResponse } from 'next/server'

const AUTH_SECRET = process.env.AUTH_SECRET || 'campusmind-secret-key-change-in-production'

async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [userId, timestamp, hmac] = parts
    const expectedHmac = (await sha256Hex(`${userId}.${timestamp}.${AUTH_SECRET}`)).slice(0, 32)
    if (hmac !== expectedHmac) return null
    const tokenAge = Date.now() - parseInt(timestamp, 36)
    if (tokenAge > 30 * 24 * 60 * 60 * 1000) return null
    return userId
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 对 API 路由注入 X-User-Id
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      const userId = await verifyToken(token)
      if (userId) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('X-User-Id', userId)
        return NextResponse.next({
          request: { headers: requestHeaders },
        })
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
