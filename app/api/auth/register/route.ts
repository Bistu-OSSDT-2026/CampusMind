import { NextRequest, NextResponse } from 'next/server'
import { prisma, isDbAvailable } from '@/lib/prisma'
import { hashPassword, createToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ code: -1, message: '请输入用户名和密码' }, { status: 400 })
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ code: -1, message: '用户名长度需为2-20个字符' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ code: -1, message: '密码长度不能少于6个字符' }, { status: 400 })
    }

    logger.api.request('POST', '/auth/register', username)

    if (!(await isDbAvailable())) {
      return NextResponse.json({ code: -1, message: '数据库不可用，无法注册' }, { status: 503 })
    }

    // 检查用户名是否已存在
    const existing = await prisma.user.findFirst({ where: { username } })
    if (existing) {
      return NextResponse.json({ code: -1, message: '用户名已存在' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username,
        password_hash: passwordHash,
        nickname: username,
      },
    })

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
    logger.error('注册错误', error)
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}
