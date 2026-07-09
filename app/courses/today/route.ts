import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const mockCourses = [
  {
    course_id: 'course-1',
    name: '高等数学',
    teacher: '张教授',
    location: '教学楼A101',
    weekday: 1,
    start_period: 1,
    end_period: 2,
    week_range: '1-16',
    created_at: '2026-07-01T08:00:00Z',
  },
  {
    course_id: 'course-2',
    name: '大学物理',
    teacher: '李教授',
    location: '物理系楼B203',
    weekday: 1,
    start_period: 3,
    end_period: 4,
    week_range: '1-16',
    created_at: '2026-07-01T08:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/courses/today', userId)

  if (!userId) {
    logger.api.response('GET', '/courses/today', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  const today = new Date()
  const weekday = today.getDay() === 0 ? 7 : today.getDay()

  logger.api.processing('查询今日课程', { today: today.toISOString(), weekday })

  const todayCourses = mockCourses.filter((course) => course.weekday === weekday)

  const responseData = {
    code: 0,
    message: 'success',
    data: todayCourses,
  }

  logger.api.response('GET', '/courses/today', 200, responseData)

  return NextResponse.json(responseData)
}
