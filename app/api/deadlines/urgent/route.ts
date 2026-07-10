import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const mockUrgentDeadlines = [
  {
    ddl_id: 'ddl-math-homework',
    user_id: 'user-1',
    course_id: 'course-1',
    type: 'homework',
    subject: '高数作业 P132',
    deadline_time: new Date(Date.now() + 86400000).toISOString(),
    weight: 4,
    status: 'pending',
    description: '完成习题 P132 第 1-10 题',
    created_at: '2026-07-01T08:00:00Z',
    countdown_days: 1,
  },
  {
    ddl_id: 'ddl-physics-report',
    user_id: 'user-1',
    course_id: 'course-2',
    type: 'homework',
    subject: '物理实验报告',
    deadline_time: new Date(Date.now() + 2 * 86400000).toISOString(),
    weight: 3,
    status: 'pending',
    description: '提交力学实验报告',
    created_at: '2026-07-01T08:00:00Z',
    countdown_days: 2,
  },
  {
    ddl_id: 'ddl-math-exam',
    user_id: 'user-1',
    course_id: 'course-1',
    type: 'exam',
    subject: '高数期中考试',
    deadline_time: new Date(Date.now() + 4 * 86400000).toISOString(),
    weight: 5,
    status: 'pending',
    description: '期中考试',
    created_at: '2026-07-01T08:00:00Z',
    countdown_days: 4,
  },
]

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/deadlines/urgent', userId)

  if (!userId) {
    logger.api.response('GET', '/deadlines/urgent', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const now = new Date()

    logger.api.processing('查询紧迫死线', { filter: 'status === pending && deadline_time >= now' })

    const deadlines = await prisma.deadline.findMany({
      where: {
        user_id: userId,
        status: 'pending',
        deadline_time: {
          gte: now,
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

    logger.api.response('GET', '/deadlines/urgent', 200, responseData)

    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询紧迫死线（Mock模式）')

    const responseData = {
      code: 0,
      message: 'success',
      data: mockUrgentDeadlines,
    }

    logger.api.response('GET', '/deadlines/urgent', 200, responseData)
    return NextResponse.json(responseData)
  }
}
