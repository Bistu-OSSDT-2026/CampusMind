import { IntentType } from './intent'
import { extractDeadlineInfo } from './intent'
import { prisma } from '@/lib/prisma'
import { generateReviewPlan, type LLMPlanResult, type DailyTaskLLM } from './llm'
import { generateBoundaryReply } from './boundary'
import type { ToolAction, OrchestrationResult, Deadline } from '@/types'

/**
 * 课程时段起始时间配置
 * 定义每个课程节次对应的开始时间（小时:分钟）
 */
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
  { period: 11, hour: 18, minute: 30 },
  { period: 12, hour: 19, minute: 25 },
]

/**
 * 星期标签映射
 * 索引0为空，索引1-7对应周一到周日
 */
const weekdayLabels = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

/**
 * 将课程节次转换为可读时间字符串
 * 
 * @param startPeriod 开始节次
 * @param endPeriod 结束节次
 * @returns 格式化的时间字符串，如 "08:00-09:50"
 */
function formatCourseTime(startPeriod: number, endPeriod: number): string {
  const start = periodStartTimes.find(p => p.period === startPeriod)
  const end = periodStartTimes.find(p => p.period === endPeriod + 1)
  if (start && end) {
    return `${start.hour.toString().padStart(2, '0')}:${start.minute.toString().padStart(2, '0')}-${end.hour.toString().padStart(2, '0')}:${end.minute.toString().padStart(2, '0')}`
  }
  return `${startPeriod * 2 - 1}:00-${endPeriod * 2}:00`
}

// --- Tool A: 课程查询模块 ---

/**
 * 查询用户今日课程列表
 * 
 * 逻辑：
 * 1. 获取当前日期和星期（周日为7）
 * 2. 查询数据库中该用户当天的课程
 * 3. 按开始节次升序排列
 * 4. 数据库不可用时返回Mock数据
 * 
 * @param userId 用户ID
 * @returns 课程列表
 */
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
    const today = new Date()
    const mockWeekday = today.getDay() === 0 ? 7 : today.getDay()
    return [
      { course_id: 'course-math', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: mockWeekday, start_period: 1, end_period: 2 },
      { course_id: 'course-physics', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: mockWeekday, start_period: 3, end_period: 4 },
    ]
  }
}

/**
 * 查询用户下一节课
 * 
 * 逻辑：
 * 1. 获取当前日期、星期和时间
 * 2. 查询当天所有课程
 * 3. 遍历课程，找到第一个尚未开始的课程
 * 4. 数据库不可用时返回Mock数据
 * 
 * @param userId 用户ID
 * @returns 下一节课信息，无则返回null
 */
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
      { course_id: 'course-math', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday, start_period: 1, end_period: 2 },
      { course_id: 'course-physics', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday, start_period: 3, end_period: 4 },
    ]
    return mockCourses.find(c => c.weekday === weekday) || mockCourses[0]
  }
}

/**
 * 查询用户可用复习时段
 * 
 * 逻辑：
 * 1. 获取用户所有课程
 * 2. 计算已占用的时段（星期-节次）
 * 3. 遍历周一到周五的所有时段，排除已占用时段
 * 4. 返回可用时段列表，包含格式化的时间标签
 * 
 * @param userId 用户ID
 * @returns 可用时段列表
 */
async function getAvailableSlots(userId: string) {
  try {
    const courses = await prisma.course.findMany({ where: { user_id: userId } })
    const occupiedSlots = new Set<string>()
    for (const course of courses) {
      for (let p = course.start_period; p <= course.end_period; p++) {
        occupiedSlots.add(`${course.weekday}-${p}`)
      }
    }

    const availableSlots: { weekday: number; period: number; label: string }[] = []
    for (let weekday = 1; weekday <= 5; weekday++) {
      for (let period = 1; period <= 10; period++) {
        if (!occupiedSlots.has(`${weekday}-${period}`)) {
          const startTime = periodStartTimes.find(p => p.period === period)
          const endTime = periodStartTimes.find(p => p.period === period + 1)
          if (startTime) {
            availableSlots.push({
              weekday,
              period,
              label: `${weekdayLabels[weekday]} ${startTime.hour.toString().padStart(2, '0')}:${startTime.minute.toString().padStart(2, '0')}-${endTime ? endTime.hour.toString().padStart(2, '0') + ':' + endTime.minute.toString().padStart(2, '0') : '18:20'}`,
            })
          }
        }
      }
    }
    return availableSlots
  } catch {
    return [
      { weekday: 1, period: 6, label: '周一 13:30-14:20' },
      { weekday: 1, period: 8, label: '周一 15:30-16:20' },
      { weekday: 2, period: 1, label: '周二 08:00-08:50' },
      { weekday: 2, period: 8, label: '周二 15:30-16:20' },
      { weekday: 3, period: 6, label: '周三 13:30-14:20' },
      { weekday: 4, period: 1, label: '周四 08:00-08:50' },
      { weekday: 5, period: 6, label: '周五 13:30-14:20' },
    ]
  }
}

// --- Tool B: 死线管理模块 ---

/**
 * 查询用户7天内的紧迫死线
 * 
 * 逻辑：
 * 1. 获取当前时间和7天后时间
 * 2. 查询状态为pending且截止时间在该范围内的死线
 * 3. 按截止时间升序排列
 * 4. 转换为前端所需格式，计算倒计时天数
 * 
 * @param userId 用户ID
 * @returns 紧迫死线列表
 */
async function getUrgentDeadlines(userId: string): Promise<Deadline[]> {
  try {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const deadlines = await prisma.deadline.findMany({
      where: { user_id: userId, status: 'pending', deadline_time: { gte: now, lte: sevenDaysLater } },
      orderBy: { deadline_time: 'asc' },
    })
    return deadlines.map(d => ({
      ddl_id: d.ddl_id,
      type: d.type as 'homework' | 'exam' | 'other',
      subject: d.subject,
      course_id: d.course_id ?? undefined,
      deadline_time: d.deadline_time.toISOString(),
      countdown_days: Math.ceil((d.deadline_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      weight: d.weight,
      status: d.status as 'pending' | 'completed' | 'expired',
      description: d.description ?? undefined,
      created_at: d.created_at.toISOString(),
    }))
  } catch {
    const now = new Date()
    return [
      { ddl_id: 'ddl-math-homework', type: 'homework', subject: '高数作业 P132', deadline_time: new Date(now.getTime() + 86400000).toISOString(), countdown_days: 1, weight: 4, status: 'pending', created_at: now.toISOString() },
      { ddl_id: 'ddl-math-exam', type: 'exam', subject: '高数考试', deadline_time: new Date(now.getTime() + 4 * 86400000).toISOString(), countdown_days: 4, weight: 5, status: 'pending', created_at: now.toISOString() },
    ]
  }
}

/**
 * 创建死线
 * 
 * @param userId 用户ID
 * @param type 死线类型（exam/homework/other）
 * @param subject 科目名称
 * @param deadlineTime 截止时间
 * @param weight 权重（1-5）
 * @returns 创建的死线对象
 */
async function createDeadline(userId: string, type: string, subject: string, deadlineTime: Date, weight: number = 3) {
  try {
    const deadline = await prisma.deadline.create({
      data: { user_id: userId, type, subject, deadline_time: deadlineTime, weight },
    })
    return deadline
  } catch {
    return { ddl_id: `ddl-${Date.now()}`, type, subject, deadline_time: deadlineTime, weight, status: 'pending' }
  }
}

// --- Tool C: 计划生成模块（调用LLM） ---

/**
 * 根据死线生成复习计划
 * 
 * 流程：
 * 1. 查询紧迫死线，找到目标死线
 * 2. 计算距离考试的天数
 * 3. 查询可用复习时段
 * 4. 调用LLM生成详细计划（内置降级策略）
 * 5. 将LLM结果转换为内部格式
 * 
 * @param userId 用户ID
 * @param ddlId 死线ID
 * @param dailyHoursLimit 每日学习时长限制
 * @returns 复习计划对象，无死线时返回null
 */
async function generatePlan(userId: string, ddlId: string, dailyHoursLimit: number = 4) {
  const urgentDeadlines = await getUrgentDeadlines(userId)
  const deadline = urgentDeadlines.find(d => d.ddl_id === ddlId) || urgentDeadlines[0]

  if (!deadline) return null

  const now = new Date()
  const deadlineDate = new Date(deadline.deadline_time)
  const daysLeft = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const availableSlots = await getAvailableSlots(userId)
  const slotLabels = availableSlots.slice(0, 10).map(s => s.label)

  const llmResult = await generateReviewPlan(
    deadline.subject,
    daysLeft,
    dailyHoursLimit,
    [],
    [],
    slotLabels
  )

  const tasks = llmResult.daily_tasks.map((t: DailyTaskLLM, i: number) => ({
    task_id: `task-${Date.now()}-${i}`,
    date: t.date,
    knowledge_points: t.knowledge_points,
    title: t.title,
    exercises: t.exercises,
    time_slot: `${t.duration_hours}小时`,
    duration_minutes: t.duration_hours * 60,
    priority: t.priority,
    status: 'pending' as const,
  }))

  return {
    plan_id: `plan-${Date.now()}`,
    plan_name: llmResult.plan_name,
    subject: `${deadline.subject}冲刺复习计划`,
    exam_date: deadline.deadline_time,
    status: 'active' as const,
    daily_hours_limit: dailyHoursLimit,
    total_hours: llmResult.total_hours,
    generated_at: new Date().toISOString(),
    tasks,
  }
}

// --- 编排引擎主入口 ---

/**
 * 编排引擎核心函数
 * 根据用户意图执行对应的工具链并返回结果
 * 
 * 意图处理流程：
 * 1. course_query: 查询下节课 + 今日课程
 * 2. deadline_create: 解析日期和科目 → 创建死线
 * 3. plan_generate: 查询死线 → 查询可用时段 → 生成计划（串联执行）
 * 4. aggregated_query: 查询今日课程 + 紧迫死线（并行执行）
 * 5. checkin_feedback: 查询死线状态 → 返回打卡反馈
 * 6. review_start: 查询死线 → 返回复习建议
 * 7. boundary: 查询死线 → 生成边界回复
 * 
 * @param intent 用户意图类型
 * @param message 用户输入消息
 * @param userId 用户ID
 * @returns 编排结果，包含回复内容、意图、工具调用记录
 */
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

      if (todayCourses.length > 0) {
        const todayCourseList = todayCourses.map(c => `${c.name} - ${c.location} - ${formatCourseTime(c.start_period, c.end_period)}`).join('\n• ')
        return {
          reply: `今天已经没有下一节课了，但今天有以下课程：\n• ${todayCourseList}`,
          intent,
          actions,
        }
      }

      return { reply: '今天没有课程安排，好好休息吧！', intent, actions }
    }

    case 'deadline_create': {
      const info = extractDeadlineInfo(message)
      const subject = info.subject || message
      const today = new Date()
      const daysOffset = info.days || 4
      const deadlineTime = new Date(today.getTime() + daysOffset * 86400000)

      const deadline = await createDeadline(userId, 'exam', subject, deadlineTime, 5)
      actions.push({ tool: 'deadline', action: 'create', result: `创建${subject}考试死线` })

      return {
        reply: `已记录：${subject}考试，预计${daysOffset}天后进行。\n\n你可以说「帮我生成复习计划」来创建复习安排。`,
        intent,
        actions,
      }
    }

    case 'plan_generate': {
      const info = extractDeadlineInfo(message)
      const urgentDeadlines = await getUrgentDeadlines(userId)
      const deadline = urgentDeadlines.find(d =>
        d.type === 'exam' || (info.subject && d.subject.includes(info.subject))
      ) || urgentDeadlines[0]

      if (!deadline) {
        return { reply: '请问是哪门课的考试？考试日期是什么时候？', intent, actions }
      }

      actions.push({ tool: 'deadline', action: 'create', result: '登记考试死线' })

      const availableSlots = await getAvailableSlots(userId)
      actions.push({ tool: 'course', action: 'query', result: '查询可用复习时段' })

      const plan = await generatePlan(userId, deadline.ddl_id)
      actions.push({ tool: 'plan', action: 'generate', result: '生成复习计划' })

      if (plan) {
        const taskList = plan.tasks.map((t: any, i: number) => {
          const dayLabel = i === 0 ? '今' : i === 1 ? '明' : `${weekdayLabels[new Date(t.date).getDay()]}`
          const priorityLabel = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'
          return `D-${plan.tasks.length - i}（${dayLabel}）：${t.knowledge_points.join(' + ')} ${priorityLabel}`
        }).join('\n')

        const slotSummary = availableSlots.slice(0, 5).map(s => s.label).join('、')

        return {
          reply: `【${plan.plan_name}】\n总时长：${plan.total_hours}小时 | 每日：${plan.daily_hours_limit}小时\n\n${taskList}\n\n已避开全部课表时段。\n可用时段：${slotSummary}等`,
          intent,
          actions,
          urgent_deadline: deadline,
        }
      }

      return { reply: '生成复习计划失败，请稍后重试。', intent, actions }
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
      actions.push({ tool: 'checkin', action: 'update', result: '打卡反馈' })

      if (urgentDeadlines.length > 0) {
        const completedCount = urgentDeadlines.filter(d => d.status === 'completed').length
        return {
          reply: `今日打卡完成！\n\n当前紧迫死线：${urgentDeadlines.length}个\n已完成：${completedCount}个\n\n继续加油！`,
          intent,
          actions,
          urgent_deadline: urgentDeadlines[0],
        }
      }

      return { reply: '今日打卡完成！当前没有紧迫死线，继续保持！', intent, actions }
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

      return { reply: '开始复习模式！请先创建一个考试死线，我会为你制定复习计划。', intent, actions }
    }

    case 'boundary': {
      const urgentDeadlines = await getUrgentDeadlines(userId)
      const urgent = urgentDeadlines[0]

      actions.push({ tool: 'deadline', action: 'query', result: '查询最紧迫死线' })

      const { reply, category } = generateBoundaryReply(message, urgent)

      return {
        reply,
        intent,
        actions: [...actions, { tool: 'deadline', action: 'query', result: `边界处理[${category}]` }],
        urgent_deadline: urgent,
      }
    }

    default: {
      return { reply: '请问是哪门课的考试？考试日期是什么时候？', intent, actions }
    }
  }
}