import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { updateCourse, deleteCourse } from '@/lib/course-store'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()
    const courseId = params.id

    logger.api.request('PUT', `/courses/${courseId}`, userId, body)

    if (!userId) {
      logger.api.response('PUT', `/courses/${courseId}`, 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
    }

    if (!body.name) {
      logger.api.response('PUT', `/courses/${courseId}`, 400, { code: -1, message: '课程名称不能为空' })
      return NextResponse.json({ code: -1, message: '课程名称不能为空' }, { status: 400 })
    }

    logger.api.processing('更新课程', { courseId, name: body.name })

    const updatedCourse = updateCourse(courseId, {
      name: body.name,
      teacher: body.teacher || '未知',
      location: body.location || '未知地点',
      weekday: body.weekday || 1,
      start_period: body.start_period || 1,
      end_period: body.end_period || 2,
      week_range: body.week_range || '1-16',
    })

    if (!updatedCourse) {
      logger.api.response('PUT', `/courses/${courseId}`, 404, { code: -1, message: '课程不存在' })
      return NextResponse.json({ code: -1, message: '课程不存在' }, { status: 404 })
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: updatedCourse,
    }

    logger.api.response('PUT', `/courses/${courseId}`, 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('课程更新接口错误', error)
    logger.api.response('PUT', `/courses/${params.id}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id')
  const courseId = params.id

  logger.api.request('DELETE', `/courses/${courseId}`, userId)

  if (!userId) {
    logger.api.response('DELETE', `/courses/${courseId}`, 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  logger.api.processing('删除课程', { courseId })

  const deleted = deleteCourse(courseId)

  if (!deleted) {
    logger.api.response('DELETE', `/courses/${courseId}`, 404, { code: -1, message: '课程不存在' })
    return NextResponse.json({ code: -1, message: '课程不存在' }, { status: 404 })
  }

  const responseData = {
    code: 0,
    message: 'success',
    data: { course_id: courseId },
  }

  logger.api.response('DELETE', `/courses/${courseId}`, 200, responseData)

  return NextResponse.json(responseData)
}