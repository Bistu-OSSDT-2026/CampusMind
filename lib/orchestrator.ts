import { IntentType } from './intent'
import { extractDeadlineInfo, extractCourseInfo, extractSubjectKeyword } from './intent'
import { prisma, isDbAvailable } from '@/lib/prisma'
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
/**
 * 查询用户指定星期几的课程
 *
 * @param userId 用户ID
 * @param weekday 星期几（1-7，1=周一，7=周日）
 * @returns 课程列表
 */
async function getCoursesByWeekday(userId: string, weekday: number) {
  try {
    if (await isDbAvailable()) {
      const courses = await prisma.course.findMany({
        where: { user_id: userId, weekday },
        orderBy: { start_period: 'asc' },
      })
      return courses
    }
  } catch {
    // DB 错误，降级为 Mock
  }

  const mockCourses = [
    { course_id: 'course-math-mon', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 1, start_period: 1, end_period: 2 },
    { course_id: 'course-math-wed', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 3, start_period: 1, end_period: 2 },
    { course_id: 'course-math-fri', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 5, start_period: 1, end_period: 2 },
    { course_id: 'course-phy-tue', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 2, start_period: 3, end_period: 4 },
    { course_id: 'course-phy-thu', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 4, start_period: 3, end_period: 4 },
    { course_id: 'course-lin-tue', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 2, start_period: 6, end_period: 7 },
    { course_id: 'course-lin-fri', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 5, start_period: 6, end_period: 7 },
  ]
  return mockCourses.filter(c => c.weekday === weekday)
}

async function getTodayCourses(userId: string) {
  const today = new Date()
  const weekday = today.getDay() === 0 ? 7 : today.getDay()

  try {
    if (await isDbAvailable()) {
      const courses = await prisma.course.findMany({
        where: { user_id: userId, weekday },
        orderBy: { start_period: 'asc' },
      })
      return courses
    }
  } catch {
    // DB 错误，降级为 Mock
  }

  const mockCourses = [
    { course_id: 'course-math-mon', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 1, start_period: 1, end_period: 2 },
    { course_id: 'course-math-wed', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 3, start_period: 1, end_period: 2 },
    { course_id: 'course-math-fri', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 5, start_period: 1, end_period: 2 },
    { course_id: 'course-phy-tue', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 2, start_period: 3, end_period: 4 },
    { course_id: 'course-phy-thu', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 4, start_period: 3, end_period: 4 },
    { course_id: 'course-lin-tue', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 2, start_period: 6, end_period: 7 },
    { course_id: 'course-lin-fri', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 5, start_period: 6, end_period: 7 },
  ]
  return mockCourses.filter(c => c.weekday === weekday)
}

/**
 * 查询用户下一节课
 * 
 * 逻辑：
 * 1. 获取当前日期、星期和时间
 * 2. 查询用户所有课程（按星期和节次排序）
 * 3. 遍历课程，找到第一个尚未开始的课程（跨天查找）
 * 4. 本周没课则返回下周第一节课
 * 5. 数据库不可用时返回Mock数据
 * 
 * @param userId 用户ID
 * @returns 下一节课信息，无则返回null
 */
async function getNextCourse(userId: string) {
  try {
    const today = new Date()
    const currentWeekday = today.getDay() === 0 ? 7 : today.getDay()
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()

    const courses = await prisma.course.findMany({
      where: { user_id: userId },
      orderBy: [{ weekday: 'asc' }, { start_period: 'asc' }],
    })

    let nextCourse = null
    for (const course of courses) {
      const startTime = periodStartTimes.find(p => p.period === course.start_period)
      if (!startTime) continue
      // 本周后续天数的课
      if (course.weekday > currentWeekday) { nextCourse = course; break }
      // 今天的课，尚未开始
      if (course.weekday === currentWeekday) {
        if (startTime.hour > currentHour || (startTime.hour === currentHour && startTime.minute >= currentMinute)) {
          nextCourse = course; break
        }
      }
    }

    // 本周没课了，返回下周第一节课
    if (!nextCourse && courses.length > 0) nextCourse = courses[0]

    return nextCourse
  } catch {
    const today = new Date()
    const currentWeekday = today.getDay() === 0 ? 7 : today.getDay()
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()
    const allMockCourses = [
      { course_id: 'course-math-mon', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 1, start_period: 1, end_period: 2 },
      { course_id: 'course-math-wed', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 3, start_period: 1, end_period: 2 },
      { course_id: 'course-math-fri', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 5, start_period: 1, end_period: 2 },
      { course_id: 'course-phy-tue', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 2, start_period: 3, end_period: 4 },
      { course_id: 'course-phy-thu', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 4, start_period: 3, end_period: 4 },
      { course_id: 'course-lin-tue', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 2, start_period: 6, end_period: 7 },
      { course_id: 'course-lin-fri', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 5, start_period: 6, end_period: 7 },
    ]
    const sortedMock = [...allMockCourses].sort((a, b) => a.weekday !== b.weekday ? a.weekday - b.weekday : a.start_period - b.start_period)
    let nextCourse = null
    for (const course of sortedMock) {
      const startTime = periodStartTimes.find(p => p.period === course.start_period)
      if (!startTime) continue
      if (course.weekday > currentWeekday) { nextCourse = course; break }
      if (course.weekday === currentWeekday) {
        if (startTime.hour > currentHour || (startTime.hour === currentHour && startTime.minute >= currentMinute)) {
          nextCourse = course; break
        }
      }
    }
    if (!nextCourse && sortedMock.length > 0) nextCourse = sortedMock[0]
    return nextCourse
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
      { ddl_id: 'ddl-physics-report', type: 'homework', subject: '物理实验报告', deadline_time: new Date(now.getTime() + 2 * 86400000).toISOString(), countdown_days: 2, weight: 3, status: 'pending', created_at: now.toISOString() },
      { ddl_id: 'ddl-math-exam', type: 'exam', subject: '高数期中考试', deadline_time: new Date(now.getTime() + 4 * 86400000).toISOString(), countdown_days: 4, weight: 5, status: 'pending', created_at: now.toISOString() },
      { ddl_id: 'ddl-linear-algebra-exam', type: 'exam', subject: '线性代数期末考试', deadline_time: new Date(now.getTime() + 7 * 86400000).toISOString(), countdown_days: 7, weight: 5, status: 'pending', created_at: now.toISOString() },
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
 * 从用户消息中解析目标星期几
 * 支持：周一~周日、星期一~星期日、今天/明天/后天/大后天
 *
 * @param message 用户输入消息
 * @returns 星期几（1-7），未匹配到返回 undefined
 */
function parseWeekdayFromMessage(message: string): number | undefined {
  const currentWeekday = new Date().getDay() === 0 ? 7 : new Date().getDay()

  const absoluteMap: Record<string, number> = {
    '周一': 1, '星期一': 1,
    '周二': 2, '星期二': 2,
    '周三': 3, '星期三': 3,
    '周四': 4, '星期四': 4,
    '周五': 5, '星期五': 5,
    '周六': 6, '星期六': 6,
    '周日': 7, '星期日': 7, '周天': 7,
  }

  // 先匹配绝对星期
  for (const [key, value] of Object.entries(absoluteMap)) {
    if (message.includes(key)) {
      return value
    }
  }

  // 再匹配相对日期
  const relativeMap: Record<string, number> = {
    '今天': 0,
    '明天': 1,
    '后天': 2,
    '大后天': 3,
  }
  for (const [key, offset] of Object.entries(relativeMap)) {
    if (message.includes(key)) {
      let target = currentWeekday + offset
      while (target > 7) target -= 7
      return target
    }
  }

  return undefined
}

/**
 * 编排引擎核心函数
 * 根据用户意图执行对应的工具链并返回结果
 *
 * 意图处理流程：
 * 1. course_query: 查询下节课 + 今日课程（支持指定星期查询）
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
export async function execute(intent: IntentType, message: string, userId: string, llmParams?: Record<string, any>): Promise<OrchestrationResult> {
  const actions: ToolAction[] = []

  switch (intent) {
    case 'course_query': {
      // 优先使用 LLM 提取的参数，否则从消息中解析
      const targetWeekday = llmParams?.weekday ?? parseWeekdayFromMessage(message)

      if (targetWeekday !== undefined) {
        // 查询指定天的课程
        const dayCourses = await getCoursesByWeekday(userId, targetWeekday)
        actions.push({ tool: 'course', action: 'query', result: `查询${weekdayLabels[targetWeekday]}课程` })

        if (dayCourses.length === 0) {
          return {
            reply: `${weekdayLabels[targetWeekday]}没有课程安排。`,
            intent,
            actions,
          }
        }

        const courseList = dayCourses.map(c => `【${c.name}】${c.location} ${formatCourseTime(c.start_period, c.end_period)}`).join('\n• ')
        return {
          reply: `${weekdayLabels[targetWeekday]}有以下课程：\n• ${courseList}`,
          intent,
          actions,
        }
      }

      // 默认行为：查询今天的课程 + 下一节课
      const [nextCourse, todayCourses] = await Promise.all([
        getNextCourse(userId),
        getTodayCourses(userId),
      ])

      actions.push({ tool: 'course', action: 'query', result: '查询课程' })

      const currentWeekday = new Date().getDay() === 0 ? 7 : new Date().getDay()

      if (nextCourse) {
        const time = formatCourseTime(nextCourse.start_period, nextCourse.end_period)
        const isToday = nextCourse.weekday === currentWeekday

        if (isToday) {
          const todayCourseList = todayCourses.map(c => `${c.name} - ${c.location} - ${formatCourseTime(c.start_period, c.end_period)}`).join('\n• ')
          return {
            reply: `下节课是【${nextCourse.name}】，在${nextCourse.location}，${time}上课。\n\n今天还有以下课程：\n• ${todayCourseList}`,
            intent,
            actions: [...actions, { tool: 'course', action: 'query', result: '查询下节课' }],
          }
        }

        // 下节课不在今天
        const dayLabel = weekdayLabels[nextCourse.weekday]
        return {
          reply: `今天没有更多课程了。下一节课是${dayLabel}的【${nextCourse.name}】，在${nextCourse.location}，${time}上课。`,
          intent,
          actions: [...actions, { tool: 'course', action: 'query', result: '查询下节课' }],
        }
      }

      if (todayCourses.length > 0) {
        const todayCourseList = todayCourses.map(c => `${c.name} - ${c.location} - ${formatCourseTime(c.start_period, c.end_period)}`).join('\n• ')
        return {
          reply: `今天的课程已经结束了，今天共有以下课程：\n• ${todayCourseList}`,
          intent,
          actions,
        }
      }

      return { reply: '目前没有任何课程安排。你可以在「课程管理」页面添加课程。', intent, actions }
    }

    case 'course_create': {
      // 优先使用 LLM 提取的参数，否则从消息中解析
      const extractedInfo = extractCourseInfo(message)
      const courseName = llmParams?.name || extractedInfo.name
      const weekday = llmParams?.weekday || extractedInfo.weekday || 1
      const startPeriod = llmParams?.start_period || extractedInfo.start_period || 1
      const endPeriod = llmParams?.end_period || extractedInfo.end_period || startPeriod + 1

      if (!courseName) {
        return {
          reply: '请告诉我课程名称，例如「添加课程 高等数学 周一第1-2节」。',
          intent,
          actions,
        }
      }

      try {
        if (await isDbAvailable()) {
          // 确保用户存在
          try {
            await prisma.user.upsert({
              where: { user_id: userId },
              update: {},
              create: { user_id: userId, nickname: userId },
            })
          } catch {
            // 用户可能已存在
          }

          const newCourse = await prisma.course.create({
            data: {
              user_id: userId,
              name: courseName,
              teacher: llmParams?.teacher || extractedInfo.teacher || '未知',
              location: llmParams?.location || extractedInfo.location || '未知地点',
              weekday,
              start_period: startPeriod,
              end_period: endPeriod,
              week_range: '1-16',
            },
          })

          actions.push({ tool: 'course', action: 'create', result: `创建课程${courseName}` })

          return {
            reply: `已添加课程【${courseName}】，${weekdayLabels[weekday]} 第${startPeriod}-${endPeriod}节。\n\n你可以在「课程管理」页面查看和编辑课程。`,
            intent,
            actions,
          }
        }
      } catch {
        // DB 错误，降级为确认回复
      }

      actions.push({ tool: 'course', action: 'create', result: `创建课程${courseName}（未持久化）` })

      return {
        reply: `已记录课程【${courseName}】，${weekdayLabels[weekday]} 第${startPeriod}-${endPeriod}节。\n\n⚠️ 数据库暂时不可用，课程数据未保存。请在数据库恢复后重新添加。`,
        intent,
        actions,
      }
    }

    case 'course_delete': {
      // 优先使用 LLM 提取的参数，否则从消息中解析
      const subject = llmParams?.name || extractSubjectKeyword(message)

      if (!subject) {
        return {
          reply: '请告诉我想删除哪门课，例如「删除课程 高等数学」。',
          intent,
          actions,
        }
      }

      try {
        if (await isDbAvailable()) {
          // 查找匹配的课程
          const courses = await prisma.course.findMany({
            where: { user_id: userId, name: { contains: subject } },
          })

          if (courses.length === 0) {
            return {
              reply: `没有找到包含「${subject}」的课程。你可以说「课表」查看已有课程。`,
              intent,
              actions,
            }
          }

          if (courses.length === 1) {
            await prisma.course.delete({ where: { course_id: courses[0].course_id } })
            actions.push({ tool: 'course', action: 'delete', result: `删除课程${courses[0].name}` })
            return {
              reply: `已删除课程【${courses[0].name}】（${weekdayLabels[courses[0].weekday]} 第${courses[0].start_period}-${courses[0].end_period}节）。`,
              intent,
              actions,
            }
          }

          // 多门课匹配，删除所有匹配的
          const deletedNames: string[] = []
          for (const course of courses) {
            await prisma.course.delete({ where: { course_id: course.course_id } })
            deletedNames.push(`${course.name}（${weekdayLabels[course.weekday]} 第${course.start_period}-${course.end_period}节）`)
          }
          actions.push({ tool: 'course', action: 'delete', result: `删除${courses.length}门${subject}课程` })
          return {
            reply: `已删除 ${courses.length} 门匹配「${subject}」的课程：\n${deletedNames.map(n => `• ${n}`).join('\n')}`,
            intent,
            actions,
          }
        }
      } catch (error) {
        // DB 错误
      }

      return {
        reply: `⚠️ 数据库暂时不可用，无法删除课程。请在数据库恢复后重试。`,
        intent,
        actions,
      }
    }

    case 'deadline_create': {
      // 优先使用 LLM 提取的参数，否则从消息中解析
      const info = extractDeadlineInfo(message)
      const subject = llmParams?.subject || info.subject || message
      const today = new Date()
      const daysOffset = llmParams?.days || info.days || 4
      const deadlineTime = new Date(today.getTime() + daysOffset * 86400000)

      // 优先使用 LLM 判断的类型，否则从消息内容判断
      let ddlType: 'exam' | 'homework' | 'other' = llmParams?.type || 'other'
      if (!llmParams?.type) {
        if (/考试|测验|期中|期末|测试/.test(message)) ddlType = 'exam'
        else if (/作业|报告|论文|实验|提交|截止/.test(message)) ddlType = 'homework'
      }
      const typeLabel: Record<string, string> = { exam: '考试', homework: '作业', other: '事项' }

      const deadline = await createDeadline(userId, ddlType, subject, deadlineTime, ddlType === 'exam' ? 5 : 3)
      actions.push({ tool: 'deadline', action: 'create', result: `创建${subject}${typeLabel[ddlType]}死线` })

      return {
        reply: `已记录：${subject}${typeLabel[ddlType]}，预计${daysOffset}天后截止。\n\n你可以说「帮我生成复习计划」来创建复习安排。`,
        intent,
        actions,
      }
    }

    case 'deadline_delete': {
      // 优先使用 LLM 提取的参数，否则从消息中解析
      const subject = llmParams?.subject || extractSubjectKeyword(message)

      if (!subject) {
        return {
          reply: '请告诉我想删除哪个提醒，例如「删除提醒 高数」。',
          intent,
          actions,
        }
      }

      try {
        if (await isDbAvailable()) {
          // 查找匹配的死线
          const deadlines = await prisma.deadline.findMany({
            where: { user_id: userId, subject: { contains: subject }, status: 'pending' },
          })

          if (deadlines.length === 0) {
            return {
              reply: `没有找到包含「${subject}」的待办提醒。你可以说「今天有什么任务」查看已有提醒。`,
              intent,
              actions,
            }
          }

          if (deadlines.length === 1) {
            await prisma.deadline.update({
              where: { ddl_id: deadlines[0].ddl_id },
              data: { status: 'completed' },
            })
            actions.push({ tool: 'deadline', action: 'delete', result: `完成提醒${deadlines[0].subject}` })
            return {
              reply: `已完成提醒【${deadlines[0].subject}】。`,
              intent,
              actions,
            }
          }

          // 多个匹配，标记全部完成
          for (const ddl of deadlines) {
            await prisma.deadline.update({
              where: { ddl_id: ddl.ddl_id },
              data: { status: 'completed' },
            })
          }
          actions.push({ tool: 'deadline', action: 'delete', result: `完成${deadlines.length}个${subject}提醒` })
          return {
            reply: `已完成 ${deadlines.length} 个匹配「${subject}」的提醒。`,
            intent,
            actions,
          }
        }
      } catch {
        // DB 错误
      }

      return {
        reply: `⚠️ 数据库暂时不可用，无法删除提醒。请在数据库恢复后重试。`,
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