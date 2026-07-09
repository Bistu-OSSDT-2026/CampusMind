import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const mockDeadlines = [
  {
    ddl_id: 'ddl-1',
    user_id: 'user-1',
    course_id: 'course-1',
    type: 'exam',
    subject: '高等数学期中考试',
    deadline_time: '2026-07-15T10:00:00Z',
    weight: 5,
    status: 'pending',
    created_at: '2026-07-01T08:00:00Z',
    updated_at: '2026-07-01T08:00:00Z',
  },
  {
    ddl_id: 'ddl-2',
    user_id: 'user-1',
    course_id: 'course-2',
    type: 'assignment',
    subject: '大学物理实验报告',
    deadline_time: '2026-07-10T23:59:00Z',
    weight: 3,
    status: 'pending',
    created_at: '2026-07-01T08:00:00Z',
    updated_at: '2026-07-01T08:00:00Z',
  },
  {
    ddl_id: 'ddl-3',
    user_id: 'user-1',
    course_id: 'course-3',
    type: 'paper',
    subject: '线性代数论文',
    deadline_time: '2026-07-20T18:00:00Z',
    weight: 4,
    status: 'pending',
    created_at: '2026-07-01T08:00:00Z',
    updated_at: '2026-07-01T08:00:00Z',
  },
]

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
      orderBy: [{ deadline_time: 'asc' }],
    })

    const responseData = {
      code: 0,
      message: 'success',
      data: deadlines.map((d) => ({
        ddl_id: d.ddl_id,
        course_id: d.course_id,
        type: d.type,
        subject: d.subject,
        deadline_time: d.deadline_time.toISOString(),
        weight: d.weight,
        status: d.status,
        created_at: d.created_at.toISOString(),
      })),
    }

    logger.api.response('GET', '/api/deadlines', 200, responseData)
    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询全部死线（Mock模式）', { count: mockDeadlines.length })

    const responseData = {
      code: 0,
      message: 'success',
      data: mockDeadlines,
    }

    logger.api.response('GET', '/api/deadlines', 200, responseData)
    return NextResponse.json(responseData)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()

    logger.api.request('POST', '/api/deadlines', userId, body)

    if (!userId) {
      logger.api.response('POST', '/api/deadlines', 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json(
        { code: -1, message: '缺少用户ID' },
        { status: 400 }
      )
    }

    if (!body.subject) {
      logger.api.response('POST', '/api/deadlines', 400, { code: -1, message: '死线主题不能为空' })
      return NextResponse.json(
        { code: -1, message: '死线主题不能为空' },
        { status: 400 }
      )
    }

    if (!body.deadline_time) {
      logger.api.response('POST', '/api/deadlines', 400, { code: -1, message: '截止时间不能为空' })
      return NextResponse.json(
        { code: -1, message: '截止时间不能为空' },
        { status: 400 }
      )
    }

    try {
      logger.api.processing('创建死线', { subject: body.subject, deadline_time: body.deadline_time })

      const deadline = await prisma.deadline.create({
        data: {
          user_id: userId,
          course_id: body.course_id || null,
          type: body.type || 'other',
          subject: body.subject,
          deadline_time: new Date(body.deadline_time),
          weight: body.weight || 3,
          status: 'pending',
        },
      })

      const responseData = {
        code: 0,
        message: 'success',
        data: {
          ddl_id: deadline.ddl_id,
          course_id: deadline.course_id,
          type: deadline.type,
          subject: deadline.subject,
          deadline_time: deadline.deadline_time.toISOString(),
          weight: deadline.weight,
          status: deadline.status,
          created_at: deadline.created_at.toISOString(),
        },
      }

      logger.api.response('POST', '/api/deadlines', 200, responseData)
      return NextResponse.json(responseData)
    } catch {
      logger.api.processing('创建死线（Mock模式）', { subject: body.subject })

      const newDeadline = {
        ddl_id: `ddl-${Date.now()}`,
        user_id: userId,
        course_id: body.course_id || null,
        type: body.type || 'other',
        subject: body.subject,
        deadline_time: new Date(body.deadline_time).toISOString(),
        weight: body.weight || 3,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const responseData = {
        code: 0,
        message: 'success',
        data: newDeadline,
      }

      logger.api.response('POST', '/api/deadlines', 200, responseData)
      return NextResponse.json(responseData)
    }
  } catch (error) {
    logger.error('死线创建接口错误', error)
    logger.api.response('POST', '/api/deadlines', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}
