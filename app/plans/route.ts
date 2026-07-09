import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const mockPlans = [
  {
    plan_id: 'plan-1',
    subject: '高数冲刺复习计划',
    exam_date: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: 'active' as const,
    daily_hours_limit: 4,
    generated_at: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/plans', userId)

  if (!userId) {
    logger.api.response('GET', '/plans', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  try {
    const plans = await prisma.plan.findMany({
      where: { user_id: userId },
      orderBy: { generated_at: 'desc' },
    })

    const responseData = {
      code: 0,
      message: 'success',
      data: plans.map(p => ({
        plan_id: p.plan_id,
        subject: p.subject,
        exam_date: p.exam_date.toISOString(),
        status: p.status,
        daily_hours_limit: p.daily_hours_limit,
        generated_at: p.generated_at.toISOString(),
      })),
    }

    logger.api.response('GET', '/plans', 200, responseData)
    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('查询计划列表（Mock模式）')

    const responseData = {
      code: 0,
      message: 'success',
      data: mockPlans,
    }

    logger.api.response('GET', '/plans', 200, responseData)
    return NextResponse.json(responseData)
  }
}
