import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { mockCourses } from '@/lib/mock-data'

declare global {
  var dynamicCourses: Array<{
    course_id: string
    name: string
    teacher: string
    location: string
    weekday: number
    start_period: number
    end_period: number
    week_range: string
    created_at: string
  }>
}

if (!global.dynamicCourses) {
  global.dynamicCourses = mockCourses.map(c => ({
    course_id: c.id,
    name: c.name,
    teacher: c.teacher,
    location: c.location,
    weekday: c.weekday,
    start_period: c.start_period,
    end_period: c.end_period,
    week_range: c.week_range,
    created_at: c.created_at,
  }))
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/courses', userId)

  if (!userId) {
    logger.api.response('GET', '/courses', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  logger.api.processing('查询全部课程', { count: global.dynamicCourses.length })

  const responseData = {
    code: 0,
    message: 'success',
    data: global.dynamicCourses,
  }

  logger.api.response('GET', '/courses', 200, responseData)

  return NextResponse.json(responseData)
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()

    logger.api.request('POST', '/courses', userId, body)

    if (!userId) {
      logger.api.response('POST', '/courses', 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
    }

    if (!body.name) {
      logger.api.response('POST', '/courses', 400, { code: -1, message: '课程名称不能为空' })
      return NextResponse.json({ code: -1, message: '课程名称不能为空' }, { status: 400 })
    }

    logger.api.processing('创建课程', { name: body.name, teacher: body.teacher })

    const newCourse = {
      course_id: `course-${Date.now()}`,
      name: body.name,
      teacher: body.teacher || '未知',
      location: body.location || '未知地点',
      weekday: body.weekday || 1,
      start_period: body.start_period || 1,
      end_period: body.end_period || 2,
      week_range: body.week_range || '1-16',
      created_at: new Date().toISOString(),
    }

    global.dynamicCourses.push(newCourse)

    const responseData = {
      code: 0,
      message: 'success',
      data: newCourse,
    }

    logger.api.response('POST', '/courses', 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('课程创建接口错误', error)
    logger.api.response('POST', '/courses', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}