import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis, getSessionKey } from '@/lib/redis'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/dialog/session', userId)

  if (!userId) {
    logger.api.response('GET', '/dialog/session', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const activeSession = await prisma.dialogSession.findFirst({
      where: {
        user_id: userId,
        status: 'active',
        expires_at: { gt: new Date() },
      },
    })

    if (!activeSession) {
      const responseData = {
        code: 0,
        message: 'success',
        data: null,
      }
      logger.api.response('GET', '/dialog/session', 200, responseData)
      return NextResponse.json(responseData)
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: {
        session_id: activeSession.session_id,
        status: activeSession.status,
        current_intent: activeSession.current_intent,
        last_active_at: activeSession.last_active_at.toISOString(),
        expires_at: activeSession.expires_at.toISOString(),
        created_at: activeSession.created_at.toISOString(),
      },
    }

    logger.api.response('GET', '/dialog/session', 200, responseData)

    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询会话状态（Mock模式）')

    const responseData = {
      code: 0,
      message: 'success',
      data: null,
    }
    logger.api.response('GET', '/dialog/session', 200, responseData)
    return NextResponse.json(responseData)
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  logger.api.request('DELETE', '/dialog/session', userId, { session_id: sessionId })

  if (!userId) {
    logger.api.response('DELETE', '/dialog/session', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    let sessionToEnd
    if (sessionId) {
      sessionToEnd = await prisma.dialogSession.findUnique({
        where: { session_id: sessionId },
      })

      if (!sessionToEnd) {
        logger.api.response('DELETE', '/dialog/session', 404, { code: -1, message: '会话不存在' })
        return NextResponse.json({ code: -1, message: '会话不存在' }, { status: 404 })
      }

      if (sessionToEnd.user_id !== userId) {
        logger.api.response('DELETE', '/dialog/session', 403, { code: -1, message: '无权结束会话' })
        return NextResponse.json({ code: -1, message: '无权结束会话' }, { status: 403 })
      }
    } else {
      sessionToEnd = await prisma.dialogSession.findFirst({
        where: {
          user_id: userId,
          status: 'active',
          expires_at: { gt: new Date() },
        },
      })

      if (!sessionToEnd) {
        logger.api.response('DELETE', '/dialog/session', 404, { code: -1, message: '没有活跃会话' })
        return NextResponse.json({ code: -1, message: '没有活跃会话' }, { status: 404 })
      }
    }

    logger.api.processing('结束会话', { session_id: sessionToEnd.session_id })

    await prisma.dialogSession.update({
      where: { session_id: sessionToEnd.session_id },
      data: { status: 'ended' },
    })

    await redis.del(getSessionKey(sessionToEnd.session_id))

    const responseData = {
      code: 0,
      message: 'success',
      data: null,
    }

    logger.api.response('DELETE', '/dialog/session', 200, responseData)

    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('结束会话（Mock模式）')

    const responseData = {
      code: 0,
      message: 'success',
      data: null,
    }

    logger.api.response('DELETE', '/dialog/session', 200, responseData)
    return NextResponse.json(responseData)
  }
}
