import { NextRequest, NextResponse } from 'next/server'
import { prisma, isDbAvailable } from '@/lib/prisma'
import { getRedis, getSessionKey, isRedisAvailable } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { detectIntent } from '@/lib/intent'
import { execute } from '@/lib/orchestrator'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const body = await request.json()
  const { message, session_id } = body

  logger.api.request('POST', '/api/dialog/message', userId, { message, session_id })

  if (!userId) {
    logger.api.response('POST', '/api/dialog/message', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  if (!message) {
    logger.api.response('POST', '/api/dialog/message', 400, { code: -1, message: '消息内容不能为空' })
    return NextResponse.json({ code: -1, message: '消息内容不能为空' }, { status: 400 })
  }

  // 快速检测数据库和 Redis 可用性
  const dbOk = await isDbAvailable()
  const redisOk = await isRedisAvailable()

  // 意图识别 + 编排引擎（不依赖数据库，始终可用）
  const intent = detectIntent(message)
  logger.api.processing('意图识别结果', { intent })

  const result = await execute(intent, message, userId)

  if (!dbOk) {
    // 数据库不可用 → 直接返回编排结果，跳过所有数据库操作
    logger.api.processing('数据库不可用，跳过会话持久化')
    const mockSessionId = session_id || `session-${Date.now()}`
    const responseData = {
      code: 0,
      message: 'success',
      data: {
        session_id: mockSessionId,
        reply: result.reply,
        intent: result.intent,
        actions: result.actions,
        urgent_deadline: result.urgent_deadline,
      },
    }
    logger.api.response('POST', '/api/dialog/message', 200, responseData)
    return NextResponse.json(responseData)
  }

  // 数据库可用 → 正常流程
  try {
    let sessionId = session_id

    if (!sessionId) {
      const activeSession = await prisma.dialogSession.findFirst({
        where: {
          user_id: userId,
          status: 'active',
          expires_at: { gt: new Date() },
        },
      })
      if (activeSession) {
        sessionId = activeSession.session_id
      }
    }

    if (!sessionId) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const newSession = await prisma.dialogSession.create({
        data: {
          user_id: userId,
          expires_at: expiresAt,
        },
      })
      sessionId = newSession.session_id

      if (redisOk) {
        await getRedis().set(getSessionKey(sessionId), JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          expires_at: expiresAt.toISOString(),
        }), 'EX', 24 * 60 * 60)
      }
    } else {
      await prisma.dialogSession.update({
        where: { session_id: sessionId },
        data: { last_active_at: new Date() },
      })
      if (redisOk) {
        await getRedis().expire(getSessionKey(sessionId), 24 * 60 * 60)
      }
    }

    await prisma.dialogMessage.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: message,
        intent,
      },
    })

    await prisma.dialogMessage.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: result.reply,
        intent,
        actions: result.actions ? JSON.parse(JSON.stringify(result.actions)) : undefined,
      },
    })

    const responseData = {
      code: 0,
      message: 'success',
      data: {
        session_id: sessionId,
        reply: result.reply,
        intent: result.intent,
        actions: result.actions,
        urgent_deadline: result.urgent_deadline,
      },
    }

    logger.api.response('POST', '/api/dialog/message', 200, responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('对话接口错误，降级为Mock模式', error)

    const mockSessionId = session_id || `session-${Date.now()}`
    const responseData = {
      code: 0,
      message: 'success',
      data: {
        session_id: mockSessionId,
        reply: result.reply,
        intent: result.intent,
        actions: result.actions,
        urgent_deadline: result.urgent_deadline,
      },
    }

    logger.api.response('POST', '/api/dialog/message', 200, responseData)
    return NextResponse.json(responseData)
  }
}
