import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  logger.api.request('GET', '/api/dialog/history', userId, { session_id: sessionId })

  if (!userId) {
    logger.api.response('GET', '/api/dialog/history', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    let messages
    if (sessionId) {
      const session = await prisma.dialogSession.findUnique({
        where: { session_id: sessionId },
      })

      if (!session) {
        logger.api.response('GET', '/api/dialog/history', 404, { code: -1, message: '会话不存在' })
        return NextResponse.json({ code: -1, message: '会话不存在' }, { status: 404 })
      }

      if (session.user_id !== userId) {
        logger.api.response('GET', '/api/dialog/history', 403, { code: -1, message: '无权访问' })
        return NextResponse.json({ code: -1, message: '无权访问' }, { status: 403 })
      }

      messages = await prisma.dialogMessage.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: 'asc' },
      })
    } else {
      messages = await prisma.dialogMessage.findMany({
        where: { user_id: userId },
        orderBy: [{ session_id: 'desc' }, { created_at: 'asc' }],
        take: 50,
      })
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: messages.map((m) => ({
        message_id: m.message_id,
        session_id: m.session_id,
        role: m.role,
        content: m.content,
        intent: m.intent,
        actions: m.actions ? JSON.parse(m.actions) : null,
        created_at: m.created_at.toISOString(),
      })),
    }

    logger.api.response('GET', '/api/dialog/history', 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('查询对话历史失败', error)
    logger.api.response('GET', '/api/dialog/history', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}