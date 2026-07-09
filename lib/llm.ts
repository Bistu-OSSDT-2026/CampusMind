import { z } from 'zod'

// --- Zod Schema：LLM 结果解析 ---

const DailyTaskSchema = z.object({
  day: z.number().int().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD'),
  title: z.string().min(1),
  knowledge_points: z.array(z.string()).min(1),
  exercises: z.array(z.string()),
  duration_hours: z.number().positive().max(12),
  priority: z.enum(['high', 'medium', 'low']),
})

const LLMPlanResultSchema = z.object({
  plan_name: z.string().min(1),
  daily_tasks: z.array(DailyTaskSchema).min(1),
  total_hours: z.number().positive(),
})

export type DailyTaskLLM = z.infer<typeof DailyTaskSchema>
export type LLMPlanResult = z.infer<typeof LLMPlanResultSchema>

// --- 提示词模板 ---

const REVIEW_PLAN_TEMPLATE = `你是一个专业的学习规划助手，擅长为大学生制定考试复习计划。

用户信息：
- 考试科目：{subject}
- 距离考试：{days_left} 天
- 每日可用时间：{daily_hours} 小时
- 已学知识点：{learned_points}
- 薄弱知识点：{weak_points}
- 可用复习时段：{available_slots}

请根据以下约束生成复习计划：
1. 按天数分配复习内容，每天学习时间不超过 {daily_hours} 小时
2. 优先安排薄弱知识点的复习
3. 每天包含具体的知识点和习题练习
4. 最后一天安排模拟考试和错题回顾
5. 尽量安排在可用复习时段内

输出格式（纯JSON，不要包含其他文字）：
{
  "plan_name": "string",
  "daily_tasks": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "title": "string",
      "knowledge_points": ["string"],
      "exercises": ["string"],
      "duration_hours": number,
      "priority": "high|medium|low"
    }
  ],
  "total_hours": number
}`

const WEAK_POINTS_TEMPLATE = `分析用户在{subject}科目上的薄弱知识点。

用户描述：{user_input}

输出格式（纯JSON）：
{
  "weak_points": ["知识点1", "知识点2"]
}`

// --- 三级降级策略 ---

function createFallbackPlan(
  subject: string,
  daysLeft: number,
  dailyHours: number,
  weakPoints: string[] = []
): LLMPlanResult {
  const today = new Date()
  const knowledgePoints = weakPoints.length > 0
    ? [...weakPoints, '综合练习', '模拟测试']
    : ['极限与连续', '导数与微分', '中值定理', '积分', '微分方程']

  const dailyTasks: DailyTaskLLM[] = []

  for (let i = 0; i < daysLeft; i++) {
    const taskDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
    const isLastDay = i === daysLeft - 1
    const pointIndex = i % knowledgePoints.length

    dailyTasks.push({
      day: i + 1,
      date: taskDate.toISOString().split('T')[0],
      title: isLastDay ? '模拟考试与错题回顾' : `${knowledgePoints[pointIndex]}复习`,
      knowledge_points: isLastDay ? ['模拟考试', '错题回顾'] : [knowledgePoints[pointIndex]],
      exercises: isLastDay ? ['历年真题模拟', '错题本回顾'] : [`习题 P${130 + i * 5}-${140 + i * 5}`],
      duration_hours: dailyHours,
      priority: isLastDay || (weakPoints.includes(knowledgePoints[pointIndex])) ? 'high' : 'medium',
    })
  }

  return {
    plan_name: `${subject}冲刺复习计划`,
    daily_tasks: dailyTasks,
    total_hours: daysLeft * dailyHours,
  }
}

function createMinimalFallback(subject: string, daysLeft: number): LLMPlanResult {
  const today = new Date()
  return {
    plan_name: `${subject}复习计划`,
    daily_tasks: [{
      day: 1,
      date: today.toISOString().split('T')[0],
      title: `${subject}基础复习`,
      knowledge_points: ['基础知识点复习'],
      exercises: ['课后习题'],
      duration_hours: 2,
      priority: 'high',
    }],
    total_hours: 2,
  }
}

// --- LLM 调用 ---

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    return null
  }

  const { OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  return response.choices[0]?.message?.content || null
}

// --- 结果解析 ---

function parsePlanResult(raw: string): LLMPlanResult | null {
  try {
    const json = JSON.parse(raw)
    const result = LLMPlanResultSchema.safeParse(json)
    if (result.success) {
      return result.data
    }
    // 尝试宽松解析：只取关键字段
    if (json.plan_name && Array.isArray(json.daily_tasks) && json.daily_tasks.length > 0) {
      const dailyTasks = json.daily_tasks.map((t: any, i: number) => ({
        day: t.day || i + 1,
        date: t.date || new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        title: t.title || `第${i + 1}天复习`,
        knowledge_points: Array.isArray(t.knowledge_points) ? t.knowledge_points : ['复习'],
        exercises: Array.isArray(t.exercises) ? t.exercises : [],
        duration_hours: typeof t.duration_hours === 'number' ? t.duration_hours : 2,
        priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
      }))
      return {
        plan_name: json.plan_name,
        daily_tasks: dailyTasks,
        total_hours: typeof json.total_hours === 'number' ? json.total_hours : dailyTasks.reduce((s: number, t: any) => s + t.duration_hours, 0),
      }
    }
    return null
  } catch {
    return null
  }
}

// --- 导出接口 ---

/**
 * 生成复习计划
 * 三级降级策略：LLM 精确解析 → LLM 宽松解析 → 硬编码降级
 */
export async function generateReviewPlan(
  subject: string,
  daysLeft: number,
  dailyHours: number = 4,
  learnedPoints: string[] = [],
  weakPoints: string[] = [],
  availableSlots: string[] = []
): Promise<LLMPlanResult> {
  const fallbackPlan = createFallbackPlan(subject, daysLeft, dailyHours, weakPoints)

  // Level 0: 无 API Key，直接降级
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    return fallbackPlan
  }

  try {
    const prompt = REVIEW_PLAN_TEMPLATE
      .replace('{subject}', subject)
      .replace('{days_left}', daysLeft.toString())
      .replace('{daily_hours}', dailyHours.toString())
      .replace('{learned_points}', learnedPoints.join('、') || '无')
      .replace('{weak_points}', weakPoints.join('、') || '无')
      .replace('{available_slots}', availableSlots.join('、') || '全天可用')

    const raw = await callOpenAI(
      '你是一个专业的学习规划助手，输出必须是纯JSON格式，不要包含其他文字。',
      prompt
    )

    if (!raw) return fallbackPlan

    // Level 1: Zod 精确解析
    const strictResult = parsePlanResult(raw)
    if (strictResult) return strictResult

    // Level 2: 宽松解析失败，降级
    return fallbackPlan
  } catch {
    // Level 3: 异常降级
    return fallbackPlan
  }
}

/**
 * 分析薄弱知识点
 * 降级策略：LLM 解析 → 硬编码降级
 */
export async function analyzeWeakPoints(subject: string, userInput: string): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    return ['中值定理', '积分计算']
  }

  try {
    const prompt = WEAK_POINTS_TEMPLATE
      .replace('{subject}', subject)
      .replace('{user_input}', userInput)

    const raw = await callOpenAI(
      '你是一个学习分析助手，输出必须是纯JSON格式。',
      prompt
    )

    if (!raw) return ['中值定理', '积分计算']

    const parsed = JSON.parse(raw)
    if (parsed.weak_points && Array.isArray(parsed.weak_points)) {
      return parsed.weak_points.filter((p: any) => typeof p === 'string')
    }

    return ['中值定理', '积分计算']
  } catch {
    return ['中值定理', '积分计算']
  }
}

/**
 * 最小降级计划（极端异常时使用）
 */
export function getMinimalFallback(subject: string, daysLeft: number): LLMPlanResult {
  return createMinimalFallback(subject, daysLeft)
}
