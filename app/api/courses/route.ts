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
  {
    id: 'course-4',
    name: '计算机基础',
    teacher: '陈老师',
    location: '计算机楼D102',
    weekday: 3,
    start_period: 1,
    end_period: 2,
    week_range: '1-16',
    created_at: '2026-07-01T08:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/api/courses', userId)

  if (!userId) {
    logger.api.response('GET', '/api/courses', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  logger.api.processing('查询全部课程', { count: mockCourses.length })

  const responseData = {
    code: 0,
    message: 'success',
    data: mockCourses,
  }

  logger.api.response('GET', '/api/courses', 200, responseData)

  return NextResponse.json(responseData)
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()

    logger.api.request('POST', '/api/courses', userId, body)

    if (!userId) {
      logger.api.response('POST', '/api/courses', 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json(
        { code: -1, message: '缺少用户ID' },
        { status: 400 }
      )
    }

    if (!body.name) {
      logger.api.response('POST', '/api/courses', 400, { code: -1, message: '课程名称不能为空' })
      return NextResponse.json(
        { code: -1, message: '课程名称不能为空' },
        { status: 400 }
      )
    }

    logger.api.processing('创建课程', { name: body.name, teacher: body.teacher })

    const newCourse = {
      id: `course-${Date.now()}`,
      name: body.name,
      teacher: body.teacher || '未知',
      location: body.location || '未知地点',
      weekday: body.weekday || 1,
      start_period: body.start_period || 1,
      end_period: body.end_period || 2,
      week_range: body.week_range || '1-16',
      created_at: new Date().toISOString(),
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: newCourse,
    }

    logger.api.response('POST', '/api/courses', 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('课程创建接口错误', error)
    logger.api.response('POST', '/api/courses', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}