import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const body = await request.json()
  const { ddl_id, daily_hours_limit = 4 } = body

  logger.api.request('POST', '/api/plans/generate', userId, { ddl_id, daily_hours_limit })

  if (!userId) {
    logger.api.response('POST', '/api/plans/generate', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  logger.api.processing('生成复习计划', { ddl_id, daily_hours_limit })

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const plan = {
    plan_id: `plan-${Date.now()}`,
    user_id: userId,
    ddl_id,
    subject: '高数冲刺复习计划',
    exam_date: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: 'active' as const,
    daily_hours_limit,
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    daily_tasks: [
      {
        task_id: 'task-1',
        task_date: new Date(Date.now()).toISOString().split('T')[0],
        knowledge_points: ['极限与连续', '习题 P132'],
        time_slot: '19:00-21:00',
        duration_minutes: 120,
        status: 'pending' as const,
      },
      {
        task_id: 'task-2',
        task_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        knowledge_points: ['导数与微分'],
        time_slot: '19:00-21:00',
        duration_minutes: 120,
        status: 'pending' as const,
      },
      {
        task_id: 'task-3',
        task_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        knowledge_points: ['中值定理'],
        time_slot: '19:00-21:00',
        duration_minutes: 120,
        status: 'pending' as const,
      },
    ],
  }

  const responseData = {
    code: 0,
    message: 'success',
    data: plan,
  }

  logger.api.response('POST', '/api/plans/generate', 200, responseData)

  return NextResponse.json(responseData)
}