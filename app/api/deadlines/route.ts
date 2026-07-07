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

  logger.api.request('GET', '/api/deadlines', userId)

  if (!userId) {
    logger.api.response('GET', '/api/deadlines', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  const responseData = {
    code: 0,
    message: 'success',
    data: mockDeadlines,
  }

  logger.api.response('GET', '/api/deadlines', 200, responseData)

  return NextResponse.json(responseData)
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const body = await request.json()

  logger.api.request('POST', '/api/deadlines', userId, body)

  if (!userId) {
    logger.api.response('POST', '/api/deadlines', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  logger.api.processing('创建死线', { subject: body.subject, type: body.type })

  const newDeadline = {
    id: `deadline-${Date.now()}`,
    type: body.type || 'other',
    subject: body.subject || '未命名任务',
    course_id: body.course_id,
    deadline_time: body.deadline_time || new Date(Date.now() + 7 * 86400000).toISOString(),
    countdown_days: Math.floor((new Date(body.deadline_time).getTime() - Date.now()) / 86400000),
    weight: body.weight || 1,
    status: 'pending' as const,
    description: body.description,
    created_at: new Date().toISOString(),
  }

  const responseData = {
    code: 0,
    message: 'success',
    data: newDeadline,
  }

  logger.api.response('POST', '/api/deadlines', 200, responseData)

  return NextResponse.json(responseData)
}