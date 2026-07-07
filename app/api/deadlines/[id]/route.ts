import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id')
  const { id } = params

  logger.api.request('GET', `/api/deadlines/${id}`, userId)

  if (!userId) {
    logger.api.response('GET', `/api/deadlines/${id}`, 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const deadline = await prisma.deadline.findUnique({
      where: { ddl_id: id },
    })

    if (!deadline) {
      logger.api.response('GET', `/api/deadlines/${id}`, 404, { code: -1, message: '死线不存在' })
      return NextResponse.json({ code: -1, message: '死线不存在' }, { status: 404 })
    }

    if (deadline.user_id !== userId) {
      logger.api.response('GET', `/api/deadlines/${id}`, 403, { code: -1, message: '无权访问' })
      return NextResponse.json({ code: -1, message: '无权访问' }, { status: 403 })
    }

    const now = new Date()
    const responseData = {
      code: 0,
      message: 'success',
      data: {
        ddl_id: deadline.ddl_id,
        type: deadline.type,
        subject: deadline.subject,
        course_id: deadline.course_id,
        deadline_time: deadline.deadline_time.toISOString(),
        countdown_days: Math.ceil((deadline.deadline_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        weight: deadline.weight,
        status: deadline.status,
        description: deadline.description,
        created_at: deadline.created_at.toISOString(),
      },
    }

    logger.api.response('GET', `/api/deadlines/${id}`, 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('查询死线详情失败', error)
    logger.api.response('GET', `/api/deadlines/${id}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id')
  const { id } = params
  const body = await request.json()

  logger.api.request('PUT', `/api/deadlines/${id}`, userId, body)

  if (!userId) {
    logger.api.response('PUT', `/api/deadlines/${id}`, 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const existingDeadline = await prisma.deadline.findUnique({
      where: { ddl_id: id },
    })

    if (!existingDeadline) {
      logger.api.response('PUT', `/api/deadlines/${id}`, 404, { code: -1, message: '死线不存在' })
      return NextResponse.json({ code: -1, message: '死线不存在' }, { status: 404 })
    }

    if (existingDeadline.user_id !== userId) {
      logger.api.response('PUT', `/api/deadlines/${id}`, 403, { code: -1, message: '无权修改' })
      return NextResponse.json({ code: -1, message: '无权修改' }, { status: 403 })
    }

    const { type, subject, course_id, deadline_time, weight, description, status } = body

    const updateData: Record<string, unknown> = {}
    if (type) {
      const validTypes = ['homework', 'exam', 'other']
      if (!validTypes.includes(type)) {
        logger.api.response('PUT', `/api/deadlines/${id}`, 400, { code: -1, message: 'type 必须是 homework/exam/other' })
        return NextResponse.json({ code: -1, message: 'type 必须是 homework/exam/other' }, { status: 400 })
      }
      updateData.type = type
    }
    if (subject) updateData.subject = subject
    if (course_id !== undefined) updateData.course_id = course_id || null
    if (deadline_time) updateData.deadline_time = new Date(deadline_time)
    if (weight !== undefined) {
      if (weight < 1 || weight > 5) {
        logger.api.response('PUT', `/api/deadlines/${id}`, 400, { code: -1, message: 'weight 必须在 1-5 之间' })
        return NextResponse.json({ code: -1, message: 'weight 必须在 1-5 之间' }, { status: 400 })
      }
      updateData.weight = weight
    }
    if (description !== undefined) updateData.description = description || null
    if (status) {
      const validStatus = ['pending', 'completed', 'expired']
      if (!validStatus.includes(status)) {
        logger.api.response('PUT', `/api/deadlines/${id}`, 400, { code: -1, message: 'status 必须是 pending/completed/expired' })
        return NextResponse.json({ code: -1, message: 'status 必须是 pending/completed/expired' }, { status: 400 })
      }
      updateData.status = status
    }

    if (Object.keys(updateData).length === 0) {
      logger.api.response('PUT', `/api/deadlines/${id}`, 400, { code: -1, message: '没有需要更新的字段' })
      return NextResponse.json({ code: -1, message: '没有需要更新的字段' }, { status: 400 })
    }

    logger.api.processing('更新死线', { ddl_id: id })

    const deadline = await prisma.deadline.update({
      where: { ddl_id: id },
      data: updateData,
    })

    const now = new Date()
    const responseData = {
      code: 0,
      message: 'success',
      data: {
        ddl_id: deadline.ddl_id,
        type: deadline.type,
        subject: deadline.subject,
        course_id: deadline.course_id,
        deadline_time: deadline.deadline_time.toISOString(),
        countdown_days: Math.ceil((deadline.deadline_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        weight: deadline.weight,
        status: deadline.status,
        description: deadline.description,
        created_at: deadline.created_at.toISOString(),
      },
    }

    logger.api.response('PUT', `/api/deadlines/${id}`, 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('更新死线失败', error)
    logger.api.response('PUT', `/api/deadlines/${id}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id')
  const { id } = params
  const body = await request.json()

  logger.api.request('PATCH', `/api/deadlines/${id}`, userId, body)

  if (!userId) {
    logger.api.response('PATCH', `/api/deadlines/${id}`, 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const existingDeadline = await prisma.deadline.findUnique({
      where: { ddl_id: id },
    })

    if (!existingDeadline) {
      logger.api.response('PATCH', `/api/deadlines/${id}`, 404, { code: -1, message: '死线不存在' })
      return NextResponse.json({ code: -1, message: '死线不存在' }, { status: 404 })
    }

    if (existingDeadline.user_id !== userId) {
      logger.api.response('PATCH', `/api/deadlines/${id}`, 403, { code: -1, message: '无权修改' })
      return NextResponse.json({ code: -1, message: '无权修改' }, { status: 403 })
    }

    const { status } = body

    if (!status) {
      logger.api.response('PATCH', `/api/deadlines/${id}`, 400, { code: -1, message: '缺少 status 字段' })
      return NextResponse.json({ code: -1, message: '缺少 status 字段' }, { status: 400 })
    }

    const validStatus = ['pending', 'completed', 'expired']
    if (!validStatus.includes(status)) {
      logger.api.response('PATCH', `/api/deadlines/${id}`, 400, { code: -1, message: 'status 必须是 pending/completed/expired' })
      return NextResponse.json({ code: -1, message: 'status 必须是 pending/completed/expired' }, { status: 400 })
    }

    logger.api.processing('更新死线状态', { ddl_id: id, status })

    const deadline = await prisma.deadline.update({
      where: { ddl_id: id },
      data: { status },
    })

    const now = new Date()
    const responseData = {
      code: 0,
      message: 'success',
      data: {
        ddl_id: deadline.ddl_id,
        type: deadline.type,
        subject: deadline.subject,
        course_id: deadline.course_id,
        deadline_time: deadline.deadline_time.toISOString(),
        countdown_days: Math.ceil((deadline.deadline_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        weight: deadline.weight,
        status: deadline.status,
        description: deadline.description,
        created_at: deadline.created_at.toISOString(),
      },
    }

    logger.api.response('PATCH', `/api/deadlines/${id}`, 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('更新死线状态失败', error)
    logger.api.response('PATCH', `/api/deadlines/${id}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id')
  const { id } = params

  logger.api.request('DELETE', `/api/deadlines/${id}`, userId)

  if (!userId) {
    logger.api.response('DELETE', `/api/deadlines/${id}`, 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const existingDeadline = await prisma.deadline.findUnique({
      where: { ddl_id: id },
    })

    if (!existingDeadline) {
      logger.api.response('DELETE', `/api/deadlines/${id}`, 404, { code: -1, message: '死线不存在' })
      return NextResponse.json({ code: -1, message: '死线不存在' }, { status: 404 })
    }

    if (existingDeadline.user_id !== userId) {
      logger.api.response('DELETE', `/api/deadlines/${id}`, 403, { code: -1, message: '无权删除' })
      return NextResponse.json({ code: -1, message: '无权删除' }, { status: 403 })
    }

    logger.api.processing('删除死线', { ddl_id: id })

    await prisma.deadline.delete({
      where: { ddl_id: id },
    })

    const responseData = {
      code: 0,
      message: 'success',
      data: null,
    }

    logger.api.response('DELETE', `/api/deadlines/${id}`, 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('删除死线失败', error)
    logger.api.response('DELETE', `/api/deadlines/${id}`, 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}