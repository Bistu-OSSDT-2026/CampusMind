import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const mockNextCourse = {
  course_id: 'course-1',
  name: '高等数学',
  teacher: '张教授',
  location: '教学楼A101',
  weekday: 1,
  start_period: 1,
  end_period: 2,
  week_range: '1-16',
  created_at: '2026-07-01T08:00:00Z',
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/courses/next', userId)

  if (!userId) {
    logger.api.response('GET', '/api/courses/next', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const courses = await prisma.course.findMany({
      where: { user_id: userId },
      orderBy: [{ weekday: 'asc' }, { start_period: 'asc' }],
    })

    const today = new Date()
    const currentWeekday = today.getDay() === 0 ? 7 : today.getDay()
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()

    const periodStartTimes = [
      { period: 1, hour: 8, minute: 0 },
      { period: 2, hour: 8, minute: 55 },
      { period: 3, hour: 10, minute: 0 },
      { period: 4, hour: 10, minute: 55 },
      { period: 5, hour: 12, minute: 0 },
      { period: 6, hour: 13, minute: 30 },
      { period: 7, hour: 14, minute: 25 },
      { period: 8, hour: 15, minute: 30 },
      { period: 9, hour: 16, minute: 25 },
      { period: 10, hour: 17, minute: 30 },
      { period: 11, hour: 18, minute: 30 },
      { period: 12, hour: 19, minute: 25 },
    ]

    let nextCourse = null

    for (const course of courses) {
      const startTime = periodStartTimes.find((p) => p.period === course.start_period)
      if (!startTime) continue

      if (course.weekday > currentWeekday) {
        nextCourse = course
        break
      }

      if (course.weekday === currentWeekday) {
        if (startTime.hour > currentHour ||
          (startTime.hour === currentHour && startTime.minute > currentMinute)) {
          nextCourse = course
          break
        }
      }
    }

    if (!nextCourse && courses.length > 0) {
      nextCourse = courses[0]
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: nextCourse
        ? {
            course_id: nextCourse.course_id,
            name: nextCourse.name,
            teacher: nextCourse.teacher || '未知',
            location: nextCourse.location || '未知地点',
            weekday: nextCourse.weekday,
            start_period: nextCourse.start_period,
            end_period: nextCourse.end_period,
            week_range: nextCourse.week_range || '1-16',
            created_at: nextCourse.created_at.toISOString(),
          }
        : null,
    }

    logger.api.response('GET', '/api/courses/next', 200, responseData)
    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询下节课（Mock模式）')

    const responseData = {
      code: 0,
      message: 'success',
      data: mockNextCourse,
    }

    logger.api.response('GET', '/api/courses/next', 200, responseData)
    return NextResponse.json(responseData)
  }
}
