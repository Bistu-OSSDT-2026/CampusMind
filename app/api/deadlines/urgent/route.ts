import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const mockDeadlines = [
  {
    id: 'deadline-1',
    type: 'homework' as const,
    subject: '高数作业 P132',
    course_id: 'course-1',
    deadline_time: new Date(Date.now() + 86400000).toISOString(),
    countdown_days: 1,
    weight: 4,
    status: 'pending' as const,
    description: '完成习题 P132 第 1-10 题',
    created_at: '2026-07-01T08:00:00Z',
  },
  {
    id: 'deadline-2',
    type: 'homework' as const,
    subject: '物理实验报告',
    course_id: 'course-2',
    deadline_time: new Date(Date.now() + 172800000).toISOString(),
    countdown_days: 2,
    weight: 3,
    status: 'pending' as const,
    description: '提交力学实验报告',
    created_at: '2026-07-01T08:00:00Z',
  },
  {
    id: 'deadline-3',
    type: 'exam' as const,
    subject: '高数考试',
    course_id: 'course-1',
    deadline_time: new Date(Date.now() + 4 * 86400000).toISOString(),
    countdown_days: 4,
    weight: 5,
    status: 'pending' as const,
    description: '期中考试',
    created_at: '2026-07-01T08:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/deadlines/urgent', userId)

  if (!userId) {
    logger.api.response('GET', '/api/deadlines/urgent', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  logger.api.processing('查询紧迫死线', { filter: 'countdown_days <= 7 && status === pending' })

  const urgentDeadlines = mockDeadlines.filter((d) => d.countdown_days <= 7 && d.status === 'pending')

  const responseData = {
    code: 0,
    message: 'success',
    data: urgentDeadlines,
  }

  logger.api.response('GET', '/api/deadlines/urgent', 200, responseData)

  return NextResponse.json(responseData)
}