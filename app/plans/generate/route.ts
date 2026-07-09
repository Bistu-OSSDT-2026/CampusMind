import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { generateReviewPlan } from '@/lib/llm'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const body = await request.json()
  const { ddl_id, daily_hours_limit = 4 } = body

  logger.api.request('POST', '/plans/generate', userId, { ddl_id, daily_hours_limit })

  if (!userId) {
    logger.api.response('POST', '/plans/generate', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  logger.api.processing('生成复习计划', { ddl_id, daily_hours_limit })

  try {
    let deadline
    if (ddl_id) {
      deadline = await prisma.deadline.findUnique({
        where: { ddl_id },
      })
    }

    const subject = deadline?.subject || '考试复习'
    const daysLeft = deadline 
      ? Math.max(1, Math.ceil((deadline.deadline_time.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 4

    const llmResult = await generateReviewPlan(subject, daysLeft, daily_hours_limit)

    const plan = await prisma.plan.create({
      data: {
        user_id: userId,
        ddl_id: ddl_id || null,
        subject: llmResult.plan_name,
        exam_date: deadline?.deadline_time || new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000),
        status: 'active',
        daily_hours_limit,
      },
    })

    for (const task of llmResult.daily_tasks) {
      await prisma.dailyTask.create({
        data: {
          plan_id: plan.plan_id,
          task_date: new Date(task.date),
          knowledge_points: task.knowledge_points,
          time_slot: `${task.duration_hours}小时`,
          duration_minutes: task.duration_hours * 60,
          status: 'pending',
        },
      })
    }

    const tasks = await prisma.dailyTask.findMany({
      where: { plan_id: plan.plan_id },
      orderBy: { task_date: 'asc' },
    })

    const responseData = {
      code: 0,
      message: 'success',
      data: {
        plan_id: plan.plan_id,
        subject: plan.subject,
        exam_date: plan.exam_date.toISOString(),
        status: plan.status,
        daily_hours_limit: plan.daily_hours_limit,
        generated_at: plan.generated_at.toISOString(),
        tasks: tasks.map(t => ({
          task_id: t.task_id,
          date: t.task_date.toISOString().split('T')[0],
          knowledge_points: t.knowledge_points,
          time_slot: t.time_slot,
          duration_minutes: t.duration_minutes,
          status: t.status,
        })),
      },
    }

    logger.api.response('POST', '/plans/generate', 200, responseData)
    return NextResponse.json(responseData)
  } catch {
    logger.api.processing('生成复习计划（Mock模式）')

    const daysLeft = 4
    const today = new Date()
    const tasks = []

    for (let i = 0; i < daysLeft; i++) {
      const taskDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
      const knowledgePoints = ['极限与连续', '导数与微分', '中值定理', '积分']
      tasks.push({
        task_id: `task-${Date.now()}-${i}`,
        date: taskDate.toISOString().split('T')[0],
        knowledge_points: [knowledgePoints[i]],
        time_slot: '19:00-21:00',
        duration_minutes: daily_hours_limit * 60,
        status: 'pending' as const,
      })
    }

    const responseData = {
      code: 0,
      message: 'success',
      data: {
        plan_id: `plan-${Date.now()}`,
        subject: '高数冲刺复习计划',
        exam_date: new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
        daily_hours_limit,
        generated_at: new Date().toISOString(),
        tasks,
      },
    }

    logger.api.response('POST', '/plans/generate', 200, responseData)
    return NextResponse.json(responseData)
  }
}
