import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { mockCourses } from '@/lib/mock-data'

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

interface TimeSlot {
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
}

function getWeekdayFromDate(dateStr: string): number {
  const date = new Date(dateStr)
  const day = date.getDay()
  return day === 0 ? 7 : day
}

function getOccupiedPeriods(dateStr: string): Set<number> {
  const weekday = getWeekdayFromDate(dateStr)
  const occupied = new Set<number>()
  
  mockCourses.forEach(course => {
    if (course.weekday === weekday) {
      for (let p = course.start_period; p <= course.end_period; p++) {
        occupied.add(p)
      }
    }
  })
  
  return occupied
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  
  logger.api.request('GET', '/api/courses/available-slots', userId)
  
  if (!userId) {
    logger.api.response('GET', '/api/courses/available-slots', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }
  
  const searchParams = request.nextUrl.searchParams
  const startDateStr = searchParams.get('start_date')
  const endDateStr = searchParams.get('end_date')
  
  if (!startDateStr || !endDateStr) {
    logger.api.response('GET', '/api/courses/available-slots', 400, { code: -1, message: '缺少日期参数' })
    return NextResponse.json({ code: -1, message: '缺少日期参数' }, { status: 400 })
  }
  
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    logger.api.response('GET', '/api/courses/available-slots', 400, { code: -1, message: '日期格式错误' })
    return NextResponse.json({ code: -1, message: '日期格式错误' }, { status: 400 })
  }
  
  const availableSlots: TimeSlot[] = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    const occupiedPeriods = getOccupiedPeriods(dateStr)
    
    for (let period = 1; period <= 8; period++) {
      if (!occupiedPeriods.has(period)) {
        const periodInfo = PERIOD_TIMES[period]
        if (periodInfo) {
          availableSlots.push({
            date: dateStr,
            start_time: periodInfo.start,
            end_time: periodInfo.end,
            duration_minutes: 95,
          })
        }
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  const responseData = {
    code: 0,
    message: 'success',
    data: availableSlots,
  }
  
  logger.api.response('GET', '/api/courses/available-slots', 200, responseData)
  
  return NextResponse.json(responseData)
}