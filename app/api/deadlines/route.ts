import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/deadlines', userId)

  if (!userId) {
    logger.api.response('GET', '/api/deadlines', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const deadlines = await prisma.deadline.findMany({
      where: { user_id: userId },
      orderBy: { deadline_time: 'asc' },
    })

    const now = new Date()
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

    logger.api.response('GET', '/api/deadlines', 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('查询死线列表失败', error)
    logger.api.response('GET', '/api/deadlines', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const body = await request.json()

  logger.api.request('POST', '/api/deadlines', userId, body)

  if (!userId) {
    logger.api.response('POST', '/api/deadlines', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  const { type, subject, course_id, deadline_time, weight, description } = body

  if (!type || !subject || !deadline_time) {
    logger.api.response('POST', '/api/deadlines', 400, { code: -1, message: '缺少必填字段: type, subject, deadline_time' })
    return NextResponse.json(
      { code: -1, message: '缺少必填字段: type, subject, deadline_time' },
      { status: 400 }
    )
  }

  const validTypes = ['homework', 'exam', 'other']
  if (!validTypes.includes(type)) {
    logger.api.response('POST', '/api/deadlines', 400, { code: -1, message: 'type 必须是 homework/exam/other' })
    return NextResponse.json(
      { code: -1, message: 'type 必须是 homework/exam/other' },
      { status: 400 }
    )
  }

  if (weight !== undefined && (weight < 1 || weight > 5)) {
    logger.api.response('POST', '/api/deadlines', 400, { code: -1, message: 'weight 必须在 1-5 之间' })
    return NextResponse.json(
      { code: -1, message: 'weight 必须在 1-5 之间' },
      { status: 400 }
    )
  }

  try {
    logger.api.processing('创建死线', { subject, type })

    const deadline = await prisma.deadline.create({
      data: {
        user_id: userId,
        type,
        subject,
        course_id: course_id || null,
        deadline_time: new Date(deadline_time),
        weight: weight || 1,
        description: description || null,
      },
    })

    const now = new Date()
    const responseData = {
      code: 0,
      message: 'success',
      data: {
        ddl_id: deadline.ddl_id,
        type: deadline.type,
        subject: deadline.subject,
        course_id: deadline.course_id,
        deadline_time: deadline.deadline_time.toISOString(),
        countdown_days: Math.ceil((deadline.deadline_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        weight: deadline.weight,
        status: deadline.status,
        description: deadline.description,
        created_at: deadline.created_at.toISOString(),
      },
    }

    logger.api.response('POST', '/api/deadlines', 201, responseData)

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    logger.error('创建死线失败', error)
    logger.api.response('POST', '/api/deadlines', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}