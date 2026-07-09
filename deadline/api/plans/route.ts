import { NextRequest, NextResponse } from 'next/server'
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

  logger.api.request('GET', '/api/plans', userId)

  if (!userId) {
    logger.api.response('GET', '/api/plans', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  const responseData = {
    code: 0,
    message: 'success',
    data: mockPlans,
  }

  logger.api.response('GET', '/api/plans', 200, responseData)

  return NextResponse.json(responseData)
}