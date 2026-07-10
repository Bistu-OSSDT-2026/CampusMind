import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { isDbAvailable } from '@/lib/prisma'
import { mockCourses } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/courses', userId)

  if (!userId) {
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    if (await isDbAvailable()) {
      const courses = await prisma.course.findMany({
        where: { user_id: userId },
        orderBy: [{ weekday: 'asc' }, { start_period: 'asc' }],
      })

      return NextResponse.json({
        code: 0,
        message: 'success',
        data: courses.map(c => ({
          course_id: c.course_id,
          name: c.name,
          teacher: c.teacher,
          location: c.location,
          weekday: c.weekday,
          start_period: c.start_period,
          end_period: c.end_period,
          week_range: c.week_range,
          created_at: c.created_at.toISOString(),
        })),
      })
    }
  } catch (error) {
    logger.error('查询课程数据库错误，降级为Mock', error)
  }

  // Mock 降级
  return NextResponse.json({
    code: 0,
    message: 'success',
    data: mockCourses.map(c => ({
      course_id: c.id,
      name: c.name,
      teacher: c.teacher,
      location: c.location,
      weekday: c.weekday,
      start_period: c.start_period,
      end_period: c.end_period,
      week_range: c.week_range,
      created_at: c.created_at,
    })),
  })
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()

    logger.api.request('POST', '/courses', userId, body)

    if (!userId) {
      return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ code: -1, message: '课程名称不能为空' }, { status: 400 })
    }

    // 确保用户存在
    if (await isDbAvailable()) {
      try {
        await prisma.user.upsert({
          where: { user_id: userId },
          update: {},
          create: { user_id: userId, nickname: userId },
        })
      } catch {
        // 用户可能已存在
      }
    }

    logger.api.processing('创建课程', { name: body.name, teacher: body.teacher })

    try {
      if (await isDbAvailable()) {
        const newCourse = await prisma.course.create({
          data: {
            user_id: userId,
            name: body.name,
            teacher: body.teacher || '未知',
            location: body.location || '未知地点',
            weekday: body.weekday || 1,
            start_period: body.start_period || 1,
            end_period: body.end_period || 2,
            week_range: body.week_range || '1-16',
          },
        })

        return NextResponse.json({
          code: 0,
          message: 'success',
          data: {
            course_id: newCourse.course_id,
            name: newCourse.name,
            teacher: newCourse.teacher,
            location: newCourse.location,
            weekday: newCourse.weekday,
            start_period: newCourse.start_period,
            end_period: newCourse.end_period,
            week_range: newCourse.week_range,
            created_at: newCourse.created_at.toISOString(),
          },
        })
      }
    } catch (error) {
      logger.error('创建课程数据库错误，降级为Mock', error)
    }

    // Mock 降级
    const mockCourse = {
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

    return NextResponse.json({ code: 0, message: 'success', data: mockCourse })
  } catch (error) {
    logger.error('课程创建接口错误', error)
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}
