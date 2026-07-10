import { z } from 'zod'

// --- Zod Schema：LLM 结果解析 ---

/**
 * 每日学习任务的Zod验证模式
 * 用于严格验证LLM返回的JSON格式
 */
const DailyTaskSchema = z.object({
  day: z.number().int().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD'),
  title: z.string().min(1),
  knowledge_points: z.array(z.string()).min(1),
  exercises: z.array(z.string()),
  duration_hours: z.number().positive().max(12),
  priority: z.enum(['high', 'medium', 'low']),
})

/**
 * 复习计划的Zod验证模式
 */
const LLMPlanResultSchema = z.object({
  plan_name: z.string().min(1),
  daily_tasks: z.array(DailyTaskSchema).min(1),
  total_hours: z.number().positive(),
})

export type DailyTaskLLM = z.infer<typeof DailyTaskSchema>
export type LLMPlanResult = z.infer<typeof LLMPlanResultSchema>

// --- 提示词模板 ---

/**
 * 复习计划生成的提示词模板
 * 包含用户信息、约束条件和输出格式要求
 */
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

/**
 * 薄弱知识点分析的提示词模板
 */
const WEAK_POINTS_TEMPLATE = `分析用户在{subject}科目上的薄弱知识点。

用户描述：{user_input}

输出格式（纯JSON）：
{
  "weak_points": ["知识点1", "知识点2"]
}`

// --- 三级降级策略 ---

/**
 * 创建降级复习计划（Level 2降级）
 * 当LLM调用失败或解析失败时使用
 * 
 * @param subject 科目名称
 * @param daysLeft 剩余天数
 * @param dailyHours 每日学习时长
 * @param weakPoints 薄弱知识点列表
 * @returns 降级复习计划
 */
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

/**
 * 创建最小降级计划（Level 3降级）
 * 极端异常情况下使用的最小化计划
 * 
 * @param subject 科目名称
 * @param daysLeft 剩余天数
 * @returns 最小降级计划
 */
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

/**
 * 调用OpenAI API
 * 
 * @param systemPrompt 系统提示词
 * @param userPrompt 用户提示词
 * @returns LLM返回的原始字符串，无API Key时返回null
 */
async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'your-openai-api-key') {
    return null
  }

  const { OpenAI } = await import('openai')
  const openai = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  })

  const model = process.env.LLM_MODEL || 'gpt-4o-mini'

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || null
}

// --- 结果解析 ---

/**
 * 解析LLM返回的计划结果
 * 
 * 解析策略：
 * 1. 首先尝试严格的Zod验证（Level 1）
 * 2. 验证失败时尝试宽松解析，只提取关键字段（Level 2）
 * 3. 宽松解析也失败时返回null
 * 
 * @param raw LLM返回的原始JSON字符串
 * @returns 解析后的计划结果，解析失败时返回null
 */
function parsePlanResult(raw: string): LLMPlanResult | null {
  try {
    const json = JSON.parse(raw)
    const result = LLMPlanResultSchema.safeParse(json)
    if (result.success) {
      return result.data
    }
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
 * 
 * 三级降级策略：
 * Level 0: 无API Key → 直接返回降级计划
 * Level 1: LLM调用成功 → Zod严格解析
 * Level 2: 严格解析失败 → 宽松解析
 * Level 3: 宽松解析失败或异常 → 返回降级计划
 * 
 * @param subject 科目名称
 * @param daysLeft 距离考试的天数
 * @param dailyHours 每日学习时长（默认4小时）
 * @param learnedPoints 已学知识点
 * @param weakPoints 薄弱知识点
 * @param availableSlots 可用复习时段
 * @returns 复习计划对象
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

    const strictResult = parsePlanResult(raw)
    if (strictResult) return strictResult

    return fallbackPlan
  } catch {
    return fallbackPlan
  }
}

/**
 * 分析薄弱知识点
 * 
 * 降级策略：
 * Level 1: LLM调用成功 → 解析返回的薄弱知识点
 * Level 2: 解析失败或异常 → 返回默认薄弱知识点
 * 
 * @param subject 科目名称
 * @param userInput 用户输入描述
 * @returns 薄弱知识点列表
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
 * 获取最小降级计划
 * 极端异常情况下使用
 * 
 * @param subject 科目名称
 * @param daysLeft 剩余天数
 * @returns 最小降级计划
 */
export function getMinimalFallback(subject: string, daysLeft: number): LLMPlanResult {
  return createMinimalFallback(subject, daysLeft)
}

// --- LLM 意图识别 ---

/**
 * LLM 意图识别的结果
 */
export interface LLMIntentResult {
  intent: string
  params: Record<string, any>
}

/**
 * 意图识别的系统提示词
 * 定义所有可用功能及其参数
 */
const INTENT_SYSTEM_PROMPT = `你是一个学业规划助手的意图识别模块。根据用户消息判断意图并提取参数。

可用功能：
1. course_query - 查询课程信息（用户想知道有什么课、下节课是什么）
   参数：weekday(可选，1-7对应周一到周日，不指定则查询今天)
2. course_create - 添加课程到课表（用户要把一门课排进课表/日程）
   参数：name(课程名), weekday(1-7), start_period(开始节次), end_period(结束节次)
   节次对应：上午=1-3节(8:00-13:15), 下午=4-5节(13:30-16:55), 晚上=6-7节(17:10-20:35)
   用户说"下午有课"→start_period=4,end_period=5; "上午有课"→start_period=1,end_period=2
3. course_delete - 从课表删除课程
   参数：name(课程名)
4. deadline_create - 添加提醒/死线/待办事项（作业、考试、报告、截止日期等）
   参数：subject(科目/事项), days(几天后截止，默认4), type(exam/homework/other)
5. deadline_delete - 删除/完成提醒（用户说"完成了"、"搞定了"、"做完了"表示完成某个事项）
   参数：subject(科目)
6. plan_generate - 生成复习计划
   参数：subject(可选，科目名)
7. aggregated_query - 综合查询今日概览
   参数：无
8. checkin_feedback - 打卡/学习反馈
   参数：无
9. review_start - 开始复习
   参数：无
10. boundary - 与学业无关的闲聊/其他话题
    参数：无

关键区分规则：
- "完成作业"、"交报告"、"要考试"、"截止日期" → deadline_create（不是course_create）
- "我有节xx课"、"排一节课"、"加一门课" → course_create（用户要把课排进课表）
- "今天有什么课"、"下节课是什么" → course_query（用户只是想查课表）
- 如果用户说"今天"且语境是添加课程，weekday参数设为今天对应的数字（今天是周五=5）

示例：
- "今天要完成高数作业" → deadline_create, {"subject":"高数","type":"homework","days":1}
- "我下周二有物理考试" → deadline_create, {"subject":"物理","type":"exam","days":7}
- "今天下午我有节高数课" → course_create, {"name":"高数","weekday":5,"start_period":4,"end_period":5}
- "今天上午有节英语课" → course_create, {"name":"英语","weekday":5,"start_period":1,"end_period":2}
- "帮我加一门英语课，周一第3-4节" → course_create, {"name":"英语","weekday":1,"start_period":3,"end_period":4}
- "英语作业已完成" → deadline_delete, {"subject":"英语"}
- "高数作业搞定了" → deadline_delete, {"subject":"高数"}
- "今天有什么课" → course_query, {"weekday":5}
- "下节课是什么" → course_query, {}
- "帮我生成复习计划" → plan_generate, {}

规则：
- 只能返回上述10个意图之一
- 参数缺失时不要编造，省略该参数即可
- 必须严格按JSON格式返回

输出格式：
{"intent":"意图名","params":{参数对象}}`

/**
 * 使用 LLM 识别用户意图并提取参数
 *
 * 降级策略：LLM 不可用时返回 null，由调用方使用关键词匹配降级
 *
 * @param message 用户输入消息
 * @returns 意图识别结果，失败时返回 null
 */
export async function detectIntentWithLLM(message: string): Promise<LLMIntentResult | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'your-openai-api-key') {
    return null
  }

  try {
    const { OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey,
      baseURL: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    })

    const model = process.env.LLM_MODEL || 'gpt-4o-mini'

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: INTENT_SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0,
      // 请求 JSON 输出（兼容不支持 response_format 的模型）
      ...(model.includes('Qwen') || model.includes('qwen')
        ? {}
        : { response_format: { type: 'json_object' } }
      ),
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    // 提取 JSON（兼容模型可能输出额外文字）
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.intent || typeof parsed.intent !== 'string') return null

    return {
      intent: parsed.intent,
      params: typeof parsed.params === 'object' && parsed.params !== null ? parsed.params : {},
    }
  } catch (error) {
    console.error('[LLM] detectIntentWithLLM failed:', error)
    return null
  }
}