import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const mockDeadline = {
  ddl_id: 'ddl-1',
  user_id: 'user-1',
  course_id: 'course-1',
  type: 'exam',
  subject: '高等数学期中考试',
  deadline_time: '2026-07-15T10:00:00Z',
  weight: 5,
  status: 'pending',
  created_at: '2026-07-01T08:00:00Z',
  updated_at: '2026-07-01T08:00:00Z',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('X-User-Id')
  const ddlId = params.id

  logger.api.request('GET', `/api/deadlines/${ddlId}`, userId)

  if (!userId) {
    logger.api.response('GET', `/api/deadlines/${ddlId}`, 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const deadline = await prisma.deadline.findUnique({
      where: {
        ddl_id: ddlId,
        user_id: userId,
      },
    })

    if (!deadline) {
      logger.api.response('GET', `/api/deadlines/${ddlId}`, 404, { code: -1, message: '死线不存在' })
      return NextResponse.json(
        { code: -1, message: '死线不存在' },
        { status: 404 }
      )
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: {
        ddl_id: deadline.ddl_id,
        course_id: deadline.course_id,
        type: deadline.type,
        subject: deadline.subject,
        deadline_time: deadline.deadline_time.toISOString(),
        weight: deadline.weight,
        status: deadline.status,
        created_at: deadline.created_at.toISOString(),
      },
    }

    logger.api.response('GET', `/api/deadlines/${ddlId}`, 200, responseData)
    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询死线详情（Mock模式）', { ddlId })

    const responseData = {
      code: 0,
      message: 'success',
      data: { ...mockDeadline, ddl_id: ddlId },
    }

    logger.api.response('GET', `/api/deadlines/${ddlId}`, 200, responseData)
    return NextResponse.json(responseData)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('X-User-Id')
    const ddlId = params.id
    const body = await request.json()

    logger.api.request('PUT', `/api/deadlines/${ddlId}`, userId, body)

    if (!userId) {
      logger.api.response('PUT', `/api/deadlines/${ddlId}`, 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json(
        { code: -1, message: '缺少用户ID' },
        { status: 400 }
      )
    }

    try {
      const deadline = await prisma.deadline.findUnique({
        where: {
          ddl_id: ddlId,
          user_id: userId,
        },
      })

      if (!deadline) {
        logger.api.response('PUT', `/api/deadlines/${ddlId}`, 404, { code: -1, message: '死线不存在' })
        return NextResponse.json(
          { code: -1, message: '死线不存在' },
          { status: 404 }
        )
      }

      logger.api.processing('更新死线', { ddlId, status: body.status })

      const updatedDeadline = await prisma.deadline.update({
        where: { ddl_id: ddlId },
        data: {
          type: body.type || deadline.type,
          subject: body.subject || deadline.subject,
          deadline_time: body.deadline_time ? new Date(body.deadline_time) : deadline.deadline_time,
          weight: body.weight !== undefined ? body.weight : deadline.weight,
          status: body.status || deadline.status,
        },
      })

      const responseData = {
        code: 0,
        message: 'success',
        data: {
          ddl_id: updatedDeadline.ddl_id,
          course_id: updatedDeadline.course_id,
          type: updatedDeadline.type,
          subject: updatedDeadline.subject,
          deadline_time: updatedDeadline.deadline_time.toISOString(),
          weight: updatedDeadline.weight,
          status: updatedDeadline.status,
          created_at: updatedDeadline.created_at.toISOString(),
        },
      }

      logger.api.response('PUT', `/api/deadlines/${ddlId}`, 200, responseData)
      return NextResponse.json(responseData)
    } catch {
      logger.api.processing('更新死线（Mock模式）', { ddlId, status: body.status })

      const responseData = {
        code: 0,
        message: 'success',
        data: {
          ...mockDeadline,
          ddl_id: ddlId,
          status: body.status || 'pending',
          updated_at: new Date().toISOString(),
        },
      }

      logger.api.response('PUT', `/api/deadlines/${ddlId}`, 200, responseData)
      return NextResponse.json(responseData)
    }
  } catch (error) {
    logger.error('死线更新接口错误', error)
    logger.api.response('PUT', `/api/deadlines/${params.id}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('X-User-Id')
    const ddlId = params.id

    logger.api.request('DELETE', `/api/deadlines/${ddlId}`, userId)

    if (!userId) {
      logger.api.response('DELETE', `/api/deadlines/${ddlId}`, 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json(
        { code: -1, message: '缺少用户ID' },
        { status: 400 }
      )
    }

    try {
      const deadline = await prisma.deadline.findUnique({
        where: {
          ddl_id: ddlId,
          user_id: userId,
        },
      })

      if (!deadline) {
        logger.api.response('DELETE', `/api/deadlines/${ddlId}`, 404, { code: -1, message: '死线不存在' })
        return NextResponse.json(
          { code: -1, message: '死线不存在' },
          { status: 404 }
        )
      }

      logger.api.processing('删除死线', { ddlId })

      await prisma.deadline.delete({
        where: { ddl_id: ddlId },
      })

      const responseData = {
        code: 0,
        message: 'success',
        data: null,
      }

      logger.api.response('DELETE', `/api/deadlines/${ddlId}`, 200, responseData)
      return NextResponse.json(responseData)
    } catch {
      logger.api.processing('删除死线（Mock模式）', { ddlId })

      const responseData = {
        code: 0,
        message: 'success',
        data: null,
      }

      logger.api.response('DELETE', `/api/deadlines/${ddlId}`, 200, responseData)
      return NextResponse.json(responseData)
    }
  } catch (error) {
    logger.error('死线删除接口错误', error)
    logger.api.response('DELETE', `/api/deadlines/${params.id}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}
