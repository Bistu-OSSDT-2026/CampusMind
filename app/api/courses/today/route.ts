import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getTodayWeekday } from '@/lib/mock-data'
import { getCoursesByWeekday } from '@/lib/course-store'

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '09:35' },
  2: { start: '09:50', end: '11:25' },
  3: { start: '11:40', end: '13:15' },
  4: { start: '13:30', end: '15:05' },
  5: { start: '15:20', end: '16:55' },
  6: { start: '17:10', end: '18:45' },
  7: { start: '19:00', end: '20:35' },
  8: { start: '20:50', end: '22:25' },
}

export function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/courses/today', userId)

  if (!userId) {
    logger.api.response('GET', '/courses/today', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  const today = new Date()
  const weekday = getTodayWeekday()

  logger.api.processing('查询今日课程', { today: today.toISOString(), weekday })

  const todayCourses = getCoursesByWeekday(weekday)

  const responseData = {
    code: 0,
    message: 'success',
    data: todayCourses.map(course => ({
      ...course,
      time: PERIOD_TIMES[course.start_period] && PERIOD_TIMES[course.end_period]
        ? `${PERIOD_TIMES[course.start_period].start}-${PERIOD_TIMES[course.end_period].end}`
        : `${course.start_period * 2 - 1}:00-${course.end_period * 2}:00`,
    })),
  }

  logger.api.response('GET', '/courses/today', 200, responseData)

  return NextResponse.json(responseData)
}