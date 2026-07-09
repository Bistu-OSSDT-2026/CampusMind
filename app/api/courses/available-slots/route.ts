import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

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

const mockAvailableSlots = [
  { weekday: 1, period: 5, label: '周一 12:00-12:50', available: true },
  { weekday: 1, period: 6, label: '周一 13:30-14:20', available: true },
  { weekday: 1, period: 8, label: '周一 15:30-16:20', available: true },
  { weekday: 1, period: 9, label: '周一 16:25-17:15', available: true },
  { weekday: 1, period: 10, label: '周一 17:30-18:20', available: true },
  { weekday: 2, period: 1, label: '周二 08:00-08:50', available: true },
  { weekday: 2, period: 2, label: '周二 08:55-09:45', available: true },
  { weekday: 2, period: 3, label: '周二 10:00-10:50', available: true },
  { weekday: 2, period: 4, label: '周二 10:55-11:45', available: true },
  { weekday: 2, period: 5, label: '周二 12:00-12:50', available: true },
  { weekday: 2, period: 8, label: '周二 15:30-16:20', available: true },
  { weekday: 2, period: 9, label: '周二 16:25-17:15', available: true },
  { weekday: 2, period: 10, label: '周二 17:30-18:20', available: true },
  { weekday: 3, period: 3, label: '周三 10:00-10:50', available: true },
  { weekday: 3, period: 4, label: '周三 10:55-11:45', available: true },
  { weekday: 3, period: 5, label: '周三 12:00-12:50', available: true },
  { weekday: 3, period: 6, label: '周三 13:30-14:20', available: true },
  { weekday: 3, period: 7, label: '周三 14:25-15:15', available: true },
  { weekday: 3, period: 10, label: '周三 17:30-18:20', available: true },
  { weekday: 4, period: 1, label: '周四 08:00-08:50', available: true },
  { weekday: 4, period: 2, label: '周四 08:55-09:45', available: true },
  { weekday: 4, period: 3, label: '周四 10:00-10:50', available: true },
  { weekday: 4, period: 4, label: '周四 10:55-11:45', available: true },
  { weekday: 4, period: 5, label: '周四 12:00-12:50', available: true },
  { weekday: 4, period: 8, label: '周四 15:30-16:20', available: true },
  { weekday: 4, period: 9, label: '周四 16:25-17:15', available: true },
  { weekday: 4, period: 10, label: '周四 17:30-18:20', available: true },
  { weekday: 5, period: 1, label: '周五 08:00-08:50', available: true },
  { weekday: 5, period: 2, label: '周五 08:55-09:45', available: true },
  { weekday: 5, period: 3, label: '周五 10:00-10:50', available: true },
  { weekday: 5, period: 4, label: '周五 10:55-11:45', available: true },
  { weekday: 5, period: 5, label: '周五 12:00-12:50', available: true },
  { weekday: 5, period: 6, label: '周五 13:30-14:20', available: true },
  { weekday: 5, period: 7, label: '周五 14:25-15:15', available: true },
  { weekday: 5, period: 8, label: '周五 15:30-16:20', available: true },
  { weekday: 5, period: 9, label: '周五 16:25-17:15', available: true },
]

const weekdayLabels = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/courses/available-slots', userId)

  if (!userId) {
    logger.api.response('GET', '/api/courses/available-slots', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const courses = await prisma.course.findMany({
      where: { user_id: userId },
    })

    const occupiedSlots = new Set<string>()
    for (const course of courses) {
      for (let p = course.start_period; p <= course.end_period; p++) {
        occupiedSlots.add(`${course.weekday}-${p}`)
      }
    }

    const availableSlots = []
    for (let weekday = 1; weekday <= 5; weekday++) {
      for (let period = 1; period <= 10; period++) {
        const key = `${weekday}-${period}`
        if (!occupiedSlots.has(key)) {
          const startTime = periodStartTimes.find((p) => p.period === period)
          if (startTime) {
            const endTime = periodStartTimes.find((p) => p.period === period + 1)
            availableSlots.push({
              weekday,
              period,
              label: `${weekdayLabels[weekday]} ${startTime.hour.toString().padStart(2, '0')}:${startTime.minute.toString().padStart(2, '0')}-${endTime ? endTime.hour.toString().padStart(2, '0') + ':' + endTime.minute.toString().padStart(2, '0') : '18:20'}`,
              available: true,
            })
          }
        }
      }
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: availableSlots,
    }

    logger.api.response('GET', '/api/courses/available-slots', 200, responseData)
    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询可用时段（Mock模式）')

    const responseData = {
      code: 0,
      message: 'success',
      data: mockAvailableSlots,
    }

    logger.api.response('GET', '/api/courses/available-slots', 200, responseData)
    return NextResponse.json(responseData)
  }
}
