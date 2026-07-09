import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { generateReviewPlan, getMinimalFallback } from '@/lib/llm'

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
    const deadlineDate = deadline?.deadline_time || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    const daysLeft = Math.max(1, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    // 调用 LLM 生成计划（内置降级）
    const llmResult = await generateReviewPlan(subject, daysLeft, daily_hours_limit)

    // 存入数据库
    const plan = await prisma.plan.create({
      data: {
        user_id: userId,
        ddl_id: ddl_id || null,
        subject: llmResult.plan_name,
        exam_date: deadlineDate,
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
        total_hours: llmResult.total_hours,
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
  } catch (error) {
    logger.error('生成复习计划失败，降级为Mock模式', error)

    // 降级：使用 LLM 降级计划（LLM 内部也有降级，最终会返回硬编码计划）
    const daysLeft = 4
    try {
      const llmResult = await generateReviewPlan('考试复习', daysLeft, daily_hours_limit)

      const responseData = {
        code: 0,
        message: 'success',
        data: {
          plan_id: `plan-${Date.now()}`,
          subject: llmResult.plan_name,
          exam_date: new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active' as const,
          daily_hours_limit,
          total_hours: llmResult.total_hours,
          generated_at: new Date().toISOString(),
          tasks: llmResult.daily_tasks.map((t, i) => ({
            task_id: `task-${Date.now()}-${i}`,
            date: t.date,
            knowledge_points: t.knowledge_points,
            time_slot: `${t.duration_hours}小时`,
            duration_minutes: t.duration_hours * 60,
            status: 'pending' as const,
          })),
        },
      }

      logger.api.response('POST', '/plans/generate', 200, responseData)
      return NextResponse.json(responseData)
    } catch {
      // 极端降级：最小计划
      const minimal = getMinimalFallback('考试复习', daysLeft)
      const responseData = {
        code: 0,
        message: 'success',
        data: {
          plan_id: `plan-${Date.now()}`,
          subject: minimal.plan_name,
          exam_date: new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active' as const,
          daily_hours_limit,
          total_hours: minimal.total_hours,
          generated_at: new Date().toISOString(),
          tasks: minimal.daily_tasks.map((t, i) => ({
            task_id: `task-${Date.now()}-${i}`,
            date: t.date,
            knowledge_points: t.knowledge_points,
            time_slot: `${t.duration_hours}小时`,
            duration_minutes: t.duration_hours * 60,
            status: 'pending' as const,
          })),
        },
      }

      logger.api.response('POST', '/plans/generate', 200, responseData)
      return NextResponse.json(responseData)
    }
  }
}
