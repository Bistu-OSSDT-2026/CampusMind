import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const courseId = params.id
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()

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

    if (global.dynamicCourses) {
      const index = global.dynamicCourses.findIndex(c => c.course_id === courseId)
      if (index !== -1) {
        global.dynamicCourses[index] = {
          ...global.dynamicCourses[index],
          name: body.name,
          teacher: body.teacher || '未知',
          location: body.location || '未知地点',
          weekday: body.weekday || 1,
          start_period: body.start_period || 1,
          end_period: body.end_period || 2,
          week_range: body.week_range || '1-16',
        }
      }
    }

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

    const responseData = {
      code: 0,
      message: 'success',
      data: updatedCourse,
    }

    logger.api.response('PUT', `/courses/${courseId}`, 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('课程更新接口错误', error)
    logger.api.response('PUT', `/courses/${courseId}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const courseId = params.id
  try {
    const userId = request.headers.get('X-User-Id')

    logger.api.request('DELETE', `/courses/${courseId}`, userId)

    if (!userId) {
      logger.api.response('DELETE', `/courses/${courseId}`, 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
    }

    logger.api.processing('删除课程', { courseId })

    if (global.dynamicCourses) {
      global.dynamicCourses = global.dynamicCourses.filter(c => c.course_id !== courseId)
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: null,
    }

    logger.api.response('DELETE', `/courses/${courseId}`, 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('课程删除接口错误', error)
    logger.api.response('DELETE', `/courses/${courseId}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}