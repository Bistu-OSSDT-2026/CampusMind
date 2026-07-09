const REVIEW_PLAN_TEMPLATE = `
你是一个专业的学习规划助手，擅长为大学生制定考试复习计划。

用户信息：
- 考试科目：{subject}
- 距离考试：{days_left} 天
- 每日可用时间：{daily_hours} 小时
- 已学知识点：{learned_points}
- 薄弱知识点：{weak_points}

请根据以下约束生成复习计划：
1. 按天数分配复习内容，每天学习时间不超过 {daily_hours} 小时
2. 优先安排薄弱知识点的复习
3. 每天包含具体的知识点和习题练习
4. 最后一天安排模拟考试和错题回顾

输出格式（JSON）：
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
}
`

export interface DailyTask {
  day: number
  date: string
  title: string
  knowledge_points: string[]
  exercises: string[]
  duration_hours: number
  priority: 'high' | 'medium' | 'low'
}

export interface LLMPlanResult {
  plan_name: string
  daily_tasks: DailyTask[]
  total_hours: number
}

function createFallbackPlan(subject: string, daysLeft: number, dailyHours: number, weakPoints: string[]): LLMPlanResult {
  const today = new Date()
  const fallbackPlan: LLMPlanResult = {
    plan_name: `${subject}复习计划`,
    daily_tasks: [],
    total_hours: daysLeft * dailyHours,
  }

  const knowledgePoints = ['极限与连续', '导数与微分', '中值定理', '积分', '微分方程']

  for (let i = 0; i < daysLeft; i++) {
    const taskDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
    const pointIndex = i % knowledgePoints.length
    
    fallbackPlan.daily_tasks.push({
      day: i + 1,
      date: taskDate.toISOString().split('T')[0],
      title: `${knowledgePoints[pointIndex]}复习`,
      knowledge_points: [knowledgePoints[pointIndex]],
      exercises: [`习题 P${130 + i}`],
      duration_hours: dailyHours,
      priority: weakPoints.includes(knowledgePoints[pointIndex]) ? 'high' : 'medium',
    })
  }

  return fallbackPlan
}

export async function generateReviewPlan(
  subject: string,
  daysLeft: number,
  dailyHours: number = 4,
  learnedPoints: string[] = [],
  weakPoints: string[] = []
): Promise<LLMPlanResult> {
  const fallbackPlan = createFallbackPlan(subject, daysLeft, dailyHours, weakPoints)

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    return fallbackPlan
  }

  try {
    const { OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = REVIEW_PLAN_TEMPLATE
      .replace('{subject}', subject)
      .replace('{days_left}', daysLeft.toString())
      .replace('{daily_hours}', dailyHours.toString())
      .replace('{learned_points}', learnedPoints.join(', ') || '无')
      .replace('{weak_points}', weakPoints.join(', ') || '无')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '你是一个专业的学习规划助手，输出必须是纯JSON格式，不要包含其他文字。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const result = response.choices[0]?.message?.content
    if (result) {
      return JSON.parse(result)
    }

    return fallbackPlan
  } catch {
    return fallbackPlan
  }
}

export async function analyzeWeakPoints(subject: string, userInput: string): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    return ['中值定理', '积分计算']
  }

  try {
    const { OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '你是一个学习分析助手，分析用户在{subject}科目上的薄弱知识点，输出JSON数组格式。' },
        { role: 'user', content: `分析用户在${subject}上的薄弱知识点：${userInput}\n\n输出格式：["知识点1", "知识点2"]` },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    })

    const result = response.choices[0]?.message?.content
    if (result) {
      const parsed = JSON.parse(result)
      return Array.isArray(parsed) ? parsed : ['中值定理', '积分计算']
    }

    return ['中值定理', '积分计算']
  } catch {
    return ['中值定理', '积分计算']
  }
}
