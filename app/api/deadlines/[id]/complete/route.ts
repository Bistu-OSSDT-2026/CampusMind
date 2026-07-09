import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('X-User-Id')
  const { id } = params

  logger.api.request('PUT', `/deadlines/${id}/complete`, userId)

  if (!userId) {
    logger.api.response('PUT', `/deadlines/${id}/complete`, 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const existingDeadline = await prisma.deadline.findUnique({
      where: { ddl_id: id },
    })

    if (!existingDeadline) {
      logger.api.response('PUT', `/deadlines/${id}/complete`, 404, { code: -1, message: '死线不存在' })
      return NextResponse.json({ code: -1, message: '死线不存在' }, { status: 404 })
    }

    if (existingDeadline.user_id !== userId) {
      logger.api.response('PUT', `/deadlines/${id}/complete`, 403, { code: -1, message: '无权修改' })
      return NextResponse.json({ code: -1, message: '无权修改' }, { status: 403 })
    }

    logger.api.processing('标记死线完成', { ddl_id: id })

    const deadline = await prisma.deadline.update({
      where: { ddl_id: id },
      data: { status: 'completed' },
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

    logger.api.response('PUT', `/deadlines/${id}/complete`, 200, responseData)

    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('标记死线完成（Mock模式）')

    const mockDeadline = {
      ddl_id: id,
      user_id: userId,
      course_id: null,
      type: 'homework',
      subject: '作业',
      deadline_time: new Date().toISOString(),
      weight: 3,
      status: 'completed',
      description: '',
      created_at: new Date().toISOString(),
      countdown_days: 0,
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: mockDeadline,
    }

    logger.api.response('PUT', `/deadlines/${id}/complete`, 200, responseData)
    return NextResponse.json(responseData)
  }
}