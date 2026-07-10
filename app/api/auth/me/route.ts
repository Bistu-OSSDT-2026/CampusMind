import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { prisma, isDbAvailable } from '@/lib/prisma'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ code: -1, message: '未登录' }, { status: 401 })
    }

    if (await isDbAvailable()) {
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { user_id: true, username: true, nickname: true },
      })
      if (user) {
        return NextResponse.json({ code: 0, message: 'success', data: user })
      }
    }

    // DB 不可用但 token 有效
    return NextResponse.json({
      code: 0,
      message: 'success',
      data: { user_id: userId, username: userId, nickname: userId },
    })
  } catch (error) {
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}
