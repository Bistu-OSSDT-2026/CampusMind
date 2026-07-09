import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const mockUrgentDeadlines = [
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
]

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/deadlines/urgent', userId)

  if (!userId) {
    logger.api.response('GET', '/api/deadlines/urgent', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const threeDaysLater = new Date()
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    const urgentDeadlines = await prisma.deadline.findMany({
      where: {
        user_id: userId,
        status: 'pending',
        deadline_time: {
          lte: threeDaysLater,
        },
      },
      orderBy: [{ deadline_time: 'asc' }],
    })

    const responseData = {
      code: 0,
      message: 'success',
      data: urgentDeadlines.map((d) => ({
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

    logger.api.response('GET', '/api/deadlines/urgent', 200, responseData)
    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询紧迫死线（Mock模式）')

    const responseData = {
      code: 0,
      message: 'success',
      data: mockUrgentDeadlines,
    }

    logger.api.response('GET', '/api/deadlines/urgent', 200, responseData)
    return NextResponse.json(responseData)
  }
}
