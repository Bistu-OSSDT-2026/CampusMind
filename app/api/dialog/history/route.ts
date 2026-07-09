import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const mockMessages = [
  {
    message_id: 'msg-1',
    session_id: 'session-1',
    role: 'user' as const,
    content: '下节课是什么？',
    intent: 'course_query',
    actions: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    message_id: 'msg-2',
    session_id: 'session-1',
    role: 'assistant' as const,
    content: '下节课是【高等数学】，在教学楼A101，08:00-09:40上课。',
    intent: 'course_query',
    actions: [{ tool: 'course', action: 'query', result: '查询今日课程' }],
    created_at: new Date(Date.now() - 3590000).toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  logger.api.request('GET', '/dialog/history', userId, { session_id: sessionId })

  if (!userId) {
    logger.api.response('GET', '/dialog/history', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    let messages
    if (sessionId) {
      const session = await prisma.dialogSession.findUnique({
        where: { session_id: sessionId },
      })

      if (!session) {
        logger.api.response('GET', '/dialog/history', 404, { code: -1, message: '会话不存在' })
        return NextResponse.json({ code: -1, message: '会话不存在' }, { status: 404 })
      }

      if (session.user_id !== userId) {
        logger.api.response('GET', '/dialog/history', 403, { code: -1, message: '无权访问' })
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
        actions: m.actions || null,
        created_at: m.created_at.toISOString(),
      })),
    }

    logger.api.response('GET', '/dialog/history', 200, responseData)

    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询对话历史（Mock模式）')

    const responseData = {
      code: 0,
      message: 'success',
      data: sessionId ? mockMessages.filter(m => m.session_id === sessionId) : mockMessages,
    }

    logger.api.response('GET', '/dialog/history', 200, responseData)
    return NextResponse.json(responseData)
  }
}
