import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/deadlines/urgent', userId)

  if (!userId) {
    logger.api.response('GET', '/api/deadlines/urgent', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    logger.api.processing('查询紧迫死线', { filter: 'countdown_days <= 7 && status === pending' })

    const deadlines = await prisma.deadline.findMany({
      where: {
        user_id: userId,
        status: 'pending',
        deadline_time: {
          gte: now,
          lte: sevenDaysLater,
        },
      },
      orderBy: { deadline_time: 'asc' },
    })

    const responseData = {
      code: 0,
      message: 'success',
      data: deadlines.map((d) => ({
        ddl_id: d.ddl_id,
        type: d.type,
        subject: d.subject,
        course_id: d.course_id,
        deadline_time: d.deadline_time.toISOString(),
        countdown_days: Math.ceil((d.deadline_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        weight: d.weight,
        status: d.status,
        description: d.description,
        created_at: d.created_at.toISOString(),
      })),
    }

    logger.api.response('GET', '/api/deadlines/urgent', 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('查询紧迫死线失败', error)
    logger.api.response('GET', '/api/deadlines/urgent', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}