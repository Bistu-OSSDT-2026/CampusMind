import { NextRequest, NextResponse } from 'next/server'
import { prisma, isDbAvailable } from '@/lib/prisma'
import { verifyPassword, createToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ code: -1, message: '请输入用户名和密码' }, { status: 400 })
    }

    logger.api.request('POST', '/auth/login', username)

    if (!(await isDbAvailable())) {
      // DB 不可用时，只允许默认账号 test/111111
      if (username === 'test' && password === '111111') {
        const token = createToken('test-user-1')
        const response = NextResponse.json({
          code: 0,
          message: 'success',
          data: { user_id: 'test-user-1', username: 'test', nickname: 'test' },
        })
        response.cookies.set('auth-token', token, AUTH_COOKIE_OPTIONS)
        return response
      }
      return NextResponse.json({ code: -1, message: '用户名或密码错误' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: { username },
    })

    if (!user || !user.password_hash) {
      return NextResponse.json({ code: -1, message: '用户名或密码错误' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ code: -1, message: '用户名或密码错误' }, { status: 401 })
    }

    const token = createToken(user.user_id)
    const response = NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        user_id: user.user_id,
        username: user.username,
        nickname: user.nickname || user.username,
      },
    })
    response.cookies.set('auth-token', token, AUTH_COOKIE_OPTIONS)
    return response
  } catch (error) {
    logger.error('登录错误', error)
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}
