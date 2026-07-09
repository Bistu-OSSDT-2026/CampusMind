import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { mockCourses, getTodayWeekday } from '@/lib/mock-data'

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

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/courses/next', userId)

  if (!userId) {
    logger.api.response('GET', '/api/courses/next', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  const today = new Date()
  const currentWeekday = getTodayWeekday()
  const currentHour = today.getHours()
  const currentMinute = today.getMinutes()

  const sortedCourses = [...mockCourses].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday
    return a.start_period - b.start_period
  })

  let nextCourse = null

  for (const course of sortedCourses) {
    const startTime = PERIOD_TIMES[course.start_period]
    if (!startTime) continue

    if (course.weekday > currentWeekday) {
      nextCourse = course
      break
    }

    if (course.weekday === currentWeekday) {
      if (startTime.start) {
        const [sh, sm] = startTime.start.split(':').map(Number)
        if (sh > currentHour || (sh === currentHour && sm > currentMinute)) {
          nextCourse = course
          break
        }
      }
    }
  }

  if (!nextCourse && sortedCourses.length > 0) {
    nextCourse = sortedCourses[0]
  }

  const responseData = {
    code: 0,
    message: 'success',
    data: nextCourse
      ? {
          course_id: nextCourse.id,
          name: nextCourse.name,
          teacher: nextCourse.teacher || '未知',
          location: nextCourse.location || '未知地点',
          weekday: nextCourse.weekday,
          start_period: nextCourse.start_period,
          end_period: nextCourse.end_period,
          week_range: nextCourse.week_range || '1-16',
          created_at: nextCourse.created_at,
          time: PERIOD_TIMES[nextCourse.start_period] && PERIOD_TIMES[nextCourse.end_period]
            ? `${PERIOD_TIMES[nextCourse.start_period].start}-${PERIOD_TIMES[nextCourse.end_period].end}`
            : `${nextCourse.start_period * 2 - 1}:00-${nextCourse.end_period * 2}:00`,
        }
      : null,
  }

  logger.api.response('GET', '/api/courses/next', 200, responseData)
  return NextResponse.json(responseData)
}