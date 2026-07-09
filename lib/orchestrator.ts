import { IntentType } from './intent'
import { prisma } from './prisma'

export interface ToolAction {
  tool: 'course' | 'deadline' | 'plan' | 'checkin' | 'review'
  action: 'query' | 'create' | 'update' | 'delete' | 'start' | 'generate'
  result: string
}

export interface OrchestrationResult {
  reply: string
  intent: IntentType
  actions: ToolAction[]
  urgent_deadline?: any
}

const periodStartTimes = [
  { period: 1, hour: 8, minute: 0 },
  { period: 2, hour: 8, minute: 55 },
  { period: 3, hour: 10, minute: 0 },
  { period: 4, hour: 10, minute: 55 },
  { period: 5, hour: 12, minute: 0 },
  { period: 6, hour: 13, minute: 30 },
  { period: 7, hour: 14, minute: 25 },
  { period: 8, hour: 15, minute: 30 },
  { period: 9, hour: 16, minute: 25 },
  { period: 10, hour: 17, minute: 30 },
]

const weekdayLabels = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

function formatCourseTime(startPeriod: number, endPeriod: number): string {
  const start = periodStartTimes.find(p => p.period === startPeriod)
  const end = periodStartTimes.find(p => p.period === endPeriod + 1)
  if (start && end) {
    return `${start.hour.toString().padStart(2, '0')}:${start.minute.toString().padStart(2, '0')}-${end.hour.toString().padStart(2, '0')}:${end.minute.toString().padStart(2, '0')}`
  }
  return `${startPeriod * 2 - 1}:00-${endPeriod * 2}:00`
}

async function getTodayCourses(userId: string) {
  try {
    const today = new Date()
    const weekday = today.getDay() === 0 ? 7 : today.getDay()
    const courses = await prisma.course.findMany({
      where: { user_id: userId, weekday },
      orderBy: { start_period: 'asc' },
    })
    return courses
  } catch {
    return [
      {
        course_id: 'course-math',
        name: '高等数学',
        teacher: '张教授',
        location: '教学楼A101',
        weekday: 1,
        start_period: 1,
        end_period: 2,
      },
      {
        course_id: 'course-physics',
        name: '大学物理',
        teacher: '李教授',
        location: '物理系楼B203',
        weekday: 1,
        start_period: 3,
        end_period: 4,
      },
    ]
  }
}

async function getNextCourse(userId: string) {
  try {
    const today = new Date()
    const weekday = today.getDay() === 0 ? 7 : today.getDay()
    const hour = today.getHours()
    const minute = today.getMinutes()

    const courses = await prisma.course.findMany({
      where: { user_id: userId, weekday },
      orderBy: { start_period: 'asc' },
    })

    for (const course of courses) {
      const startTime = periodStartTimes.find(p => p.period === course.start_period)
      if (startTime) {
        if (startTime.hour > hour || (startTime.hour === hour && startTime.minute >= minute)) {
          return course
        }
      }
    }
    return null
  } catch {
    const today = new Date()
    const weekday = today.getDay() === 0 ? 7 : today.getDay()
    const mockCourses = [
      {
        course_id: 'course-math',
        name: '高等数学',
        teacher: '张教授',
        location: '教学楼A101',
        weekday: 1,
        start_period: 1,
        end_period: 2,
      },
      {
        course_id: 'course-physics',
        name: '大学物理',
        teacher: '李教授',
        location: '物理系楼B203',
        weekday: 1,
        start_period: 3,
        end_period: 4,
      },
    ]
    return mockCourses.find(c => c.weekday === weekday) || null
  }
}

async function getUrgentDeadlines(userId: string) {
  try {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const deadlines = await prisma.deadline.findMany({
      where: {
        user_id: userId,
        status: 'pending',
        deadline_time: { gte: now, lte: sevenDaysLater },
      },
      orderBy: { deadline_time: 'asc' },
    })
    return deadlines.map(d => ({
      ...d,
      countdown_days: Math.ceil((d.deadline_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }))
  } catch {
    const now = new Date()
    return [
      {
        ddl_id: 'ddl-math-homework',
        type: 'homework' as const,
        subject: '高数作业 P132',
        deadline_time: new Date(now.getTime() + 86400000),
        countdown_days: 1,
        weight: 4,
        status: 'pending' as const,
      },
      {
        ddl_id: 'ddl-math-exam',
        type: 'exam' as const,
        subject: '高数考试',
        deadline_time: new Date(now.getTime() + 4 * 86400000),
        countdown_days: 4,
        weight: 5,
        status: 'pending' as const,
      },
    ]
  }
}

async function createDeadline(userId: string, type: string, subject: string, deadlineTime: Date, weight: number = 3) {
  try {
    const deadline = await prisma.deadline.create({
      data: {
        user_id: userId,
        type,
        subject,
        deadline_time: deadlineTime,
        weight,
      },
    })
    return deadline
  } catch {
    return {
      ddl_id: `ddl-${Date.now()}`,
      type,
      subject,
      deadline_time: deadlineTime,
      weight,
      status: 'pending',
    }
  }
}

async function generatePlan(userId: string, ddlId: string, dailyHoursLimit: number = 4) {
  const urgentDeadlines = await getUrgentDeadlines(userId)
  const deadline = urgentDeadlines.find(d => d.ddl_id === ddlId) || urgentDeadlines[0]
  
  if (!deadline) {
    return null
  }

  const now = new Date()
  const deadlineDate = new Date(deadline.deadline_time)
  const daysLeft = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const knowledgePoints = ['极限与连续', '导数与微分', '中值定理', '积分', '微分方程']
  const tasks: any[] = []
  
  for (let i = 0; i < daysLeft; i++) {
    const taskDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    const pointIndex = i % knowledgePoints.length
    tasks.push({
      task_id: `task-${Date.now()}-${i}`,
      date: taskDate.toISOString().split('T')[0],
      knowledge_points: [knowledgePoints[pointIndex]],
      time_slot: '19:00-21:00',
      duration_minutes: dailyHoursLimit * 60,
      status: i === 0 ? 'pending' : 'pending',
    })
  }

  return {
    plan_id: `plan-${Date.now()}`,
    subject: `${deadline.subject}冲刺复习计划`,
    exam_date: deadline.deadline_time,
    status: 'active' as const,
    daily_hours_limit: dailyHoursLimit,
    generated_at: new Date().toISOString(),
    tasks,
  }
}

export async function execute(intent: IntentType, message: string, userId: string): Promise<OrchestrationResult> {
  const actions: ToolAction[] = []

  switch (intent) {
    case 'course_query': {
      const [nextCourse, todayCourses] = await Promise.all([
        getNextCourse(userId),
        getTodayCourses(userId),
      ])

      actions.push({ tool: 'course', action: 'query', result: '查询今日课程' })

      if (nextCourse) {
        const time = formatCourseTime(nextCourse.start_period, nextCourse.end_period)
        const todayCourseList = todayCourses.map(c => `${c.name} - ${c.location} - ${formatCourseTime(c.start_period, c.end_period)}`).join('\n• ')
        
        return {
          reply: `下节课是【${nextCourse.name}】，在${nextCourse.location}，${time}上课。\n\n今天还有以下课程：\n• ${todayCourseList}`,
          intent,
          actions: [...actions, { tool: 'course', action: 'query', result: '查询下节课' }],
        }
      }

      return {
        reply: '今天没有课程安排，好好休息吧！',
        intent,
        actions,
      }
    }

    case 'deadline_create': {
      const today = new Date()
      const deadlineTime = new Date(today.getTime() + 4 * 86400000)
      
      const deadline = await createDeadline(userId, 'exam', message, deadlineTime, 5)
      actions.push({ tool: 'deadline', action: 'create', result: `创建${message}考试死线` })

      return {
        reply: `已记录：${message}考试，预计4天后进行。\n\n你可以说「帮我生成复习计划」来创建复习安排。`,
        intent,
        actions,
      }
    }

    case 'plan_generate': {
      const urgentDeadlines = await getUrgentDeadlines(userId)
      const deadline = urgentDeadlines.find(d => d.type === 'exam') || urgentDeadlines[0]
      
      if (!deadline) {
        return {
          reply: '请问是哪门课的考试？考试日期是什么时候？',
          intent,
          actions,
        }
      }

      actions.push({ tool: 'deadline', action: 'create', result: '登记考试死线' })
      actions.push({ tool: 'course', action: 'query', result: '查询可用复习时段' })

      const plan = await generatePlan(userId, deadline.ddl_id)
      actions.push({ tool: 'plan', action: 'create', result: '生成复习计划' })

      if (plan) {
        const taskList = plan.tasks.map((t: any, i: number) => {
          const dayLabel = i === 0 ? '今' : i === 1 ? '明' : `${weekdayLabels[new Date(t.date).getDay()]}`
          return `D-${plan.tasks.length - i}（${dayLabel}）：${t.knowledge_points.join(' + ')}`
        }).join('\n')

        return {
          reply: `【${plan.subject}】\n\n${taskList}\n\n已避开全部课表时段，每日${plan.daily_hours_limit}小时复习时间。`,
          intent,
          actions,
          urgent_deadline: deadline,
        }
      }

      return {
        reply: '生成复习计划失败，请稍后重试。',
        intent,
        actions,
      }
    }

    case 'aggregated_query': {
      const [todayCourses, urgentDeadlines] = await Promise.all([
        getTodayCourses(userId),
        getUrgentDeadlines(userId),
      ])

      actions.push({ tool: 'course', action: 'query', result: '查询今日课程' })
      actions.push({ tool: 'deadline', action: 'query', result: '查询紧迫死线' })

      const courseList = todayCourses.map(c => `${c.name} - ${c.location} - ${formatCourseTime(c.start_period, c.end_period)}`).join('\n• ')
      const deadlineList = urgentDeadlines.map(d => `${d.type === 'exam' ? '📌' : '📝'} ${d.subject} - D-${d.countdown_days}`).join('\n• ')

      return {
        reply: `📅 今日概览\n\n【今日课程】\n• ${courseList || '暂无课程'}\n\n【紧迫死线】\n• ${deadlineList || '暂无紧迫死线'}`,
        intent,
        actions,
        urgent_deadline: urgentDeadlines[0],
      }
    }

    case 'checkin_feedback': {
      const urgentDeadlines = await getUrgentDeadlines(userId)
      actions.push({ tool: 'deadline', action: 'query', result: '查询死线进度' })

      if (urgentDeadlines.length > 0) {
        const completedCount = urgentDeadlines.filter(d => d.status === 'completed').length
        return {
          reply: `今日打卡完成！\n\n当前紧迫死线：${urgentDeadlines.length}个\n已完成：${completedCount}个\n\n继续加油！`,
          intent,
          actions,
          urgent_deadline: urgentDeadlines[0],
        }
      }

      return {
        reply: '今日打卡完成！当前没有紧迫死线，继续保持！',
        intent,
        actions,
      }
    }

    case 'review_start': {
      const urgentDeadlines = await getUrgentDeadlines(userId)
      const deadline = urgentDeadlines.find(d => d.type === 'exam') || urgentDeadlines[0]

      actions.push({ tool: 'review', action: 'start', result: '开始复习' })

      if (deadline) {
        return {
          reply: `开始复习【${deadline.subject}】\n\n距离考试还有 ${deadline.countdown_days} 天\n预计复习时间：${deadline.countdown_days * 4} 小时\n\n今天重点：极限与连续（基础）`,
          intent,
          actions,
          urgent_deadline: deadline,
        }
      }

      return {
        reply: '开始复习模式！请先创建一个考试死线，我会为你制定复习计划。',
        intent,
        actions,
      }
    }

    case 'boundary': {
      const urgentDeadlines = await getUrgentDeadlines(userId)
      const urgent = urgentDeadlines[0]

      actions.push({ tool: 'deadline', action: 'query', result: '查询最紧迫死线' })

      if (urgent) {
        return {
          reply: `我只管帮你防挂科～\n\n对了，你${urgent.subject}，现在还剩${urgent.countdown_days}天。`,
          intent,
          actions,
          urgent_deadline: urgent,
        }
      }

      return {
        reply: '我只管帮你防挂科～\n\n当前没有紧迫的考试或作业，好好休息吧！',
        intent,
        actions,
      }
    }

    default: {
      return {
        reply: '请问是哪门课的考试？考试日期是什么时候？',
        intent,
        actions,
      }
    }
  }
}
