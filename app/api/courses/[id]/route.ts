import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma, isDbAvailable } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const courseId = params.id
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()

    logger.api.request('PUT', `/courses/${courseId}`, userId, body)

    if (!userId) {
      return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ code: -1, message: '课程名称不能为空' }, { status: 400 })
    }

    logger.api.processing('更新课程', { courseId, name: body.name })

    try {
      if (await isDbAvailable()) {
        const updatedCourse = await prisma.course.update({
          where: { course_id: courseId },
          data: {
            name: body.name,
            teacher: body.teacher,
            location: body.location,
            weekday: body.weekday,
            start_period: body.start_period,
            end_period: body.end_period,
            week_range: body.week_range,
          },
        })

        return NextResponse.json({
          code: 0,
          message: 'success',
          data: {
            course_id: updatedCourse.course_id,
            name: updatedCourse.name,
            teacher: updatedCourse.teacher,
            location: updatedCourse.location,
            weekday: updatedCourse.weekday,
            start_period: updatedCourse.start_period,
            end_period: updatedCourse.end_period,
            week_range: updatedCourse.week_range,
            updated_at: new Date().toISOString(),
          },
        })
      }
    } catch (error) {
      logger.error('更新课程数据库错误，降级为Mock', error)
    }

    // Mock 降级
    const updatedCourse = {
      course_id: courseId,
      name: body.name,
      teacher: body.teacher || '未知',
      location: body.location || '未知地点',
      weekday: body.weekday || 1,
      start_period: body.start_period || 1,
      end_period: body.end_period || 2,
      week_range: body.week_range || '1-16',
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({ code: 0, message: 'success', data: updatedCourse })
  } catch (error) {
    logger.error('课程更新接口错误', error)
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const courseId = params.id
  try {
    const userId = request.headers.get('X-User-Id')

    logger.api.request('DELETE', `/courses/${courseId}`, userId)

    if (!userId) {
      return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
    }

    logger.api.processing('删除课程', { courseId })

    try {
      if (await isDbAvailable()) {
        await prisma.course.delete({
          where: { course_id: courseId },
        })

        return NextResponse.json({ code: 0, message: 'success', data: null })
      }
    } catch (error) {
      logger.error('删除课程数据库错误，降级为Mock', error)
    }

    // Mock 降级
    return NextResponse.json({ code: 0, message: 'success', data: null })
  } catch (error) {
    logger.error('课程删除接口错误', error)
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}
