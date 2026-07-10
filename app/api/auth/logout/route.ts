import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ code: 0, message: 'success' })
  response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
  return response
}
