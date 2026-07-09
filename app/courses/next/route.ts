import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const mockCourses = [
  {
    id: 'course-1',
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
    id: 'course-2',
    name: '大学物理',
    teacher: '李教授',
    location: '物理系楼B203',
    weekday: 1,
    start_period: 3,
    end_period: 4,
    week_range: '1-16',
    created_at: '2026-07-01T08:00:00Z',
  },
  {
    id: 'course-3',
    name: '线性代数',
    teacher: '王教授',
    location: '数学楼C305',
    weekday: 2,
    start_period: 6,
    end_period: 7,
    week_range: '1-16',
    created_at: '2026-07-01T08:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/courses/next', userId)

  if (!userId) {
    logger.api.response('GET', '/api/courses/next', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  const today = new Date()
  const weekday = today.getDay() === 0 ? 7 : today.getDay()
  const currentHour = today.getHours()

  logger.api.processing('查询下节课', { today: today.toISOString(), weekday, currentHour })

  const periodTimes: Record<number, number> = {
    1: 8, 2: 9, 3: 10, 4: 11, 5: 12,
    6: 14, 7: 15, 8: 16, 9: 17, 10: 18,
    11: 19, 12: 20,
  }

  let nextCourse = null

  const todayCourses = mockCourses.filter((course) => course.weekday === weekday)
  for (const course of todayCourses) {
    const courseStartHour = periodTimes[course.start_period] || 8
    if (courseStartHour > currentHour) {
      nextCourse = course
      break
    }
  }

  if (!nextCourse) {
    const tomorrowWeekday = weekday === 7 ? 1 : weekday + 1
    const tomorrowCourses = mockCourses.filter((course) => course.weekday === tomorrowWeekday)
    if (tomorrowCourses.length > 0) {
      nextCourse = tomorrowCourses[0]
    }
  }

  const responseData = {
    code: 0,
    message: 'success',
    data: nextCourse,
  }

  logger.api.response('GET', '/api/courses/next', 200, responseData)

  return NextResponse.json(responseData)
}