import { IntentType } from '@/types'

export type { IntentType }

// 关键词匹配规则：按优先级排列，先匹配到的优先返回
const intentRules: { intent: IntentType; keywords: string[] }[] = [
  {
    intent: 'plan_generate',
    keywords: ['帮我复习', '生成计划', '快炸了', '复习计划', '帮我规划', '规划复习', '冲刺', '备考'],
  },
  {
    intent: 'deadline_create',
    keywords: ['设个提醒', '考', '作业', '截止', 'ddl', 'DDL', '死线', '到期', '提交', '考试', '测验', '作业截止'],
  },
  {
    intent: 'course_query',
    keywords: ['下节课', '在哪上课', '今天有几节课', '课表', '上课', '课程', '第几节', '几点上课'],
  },
  {
    intent: 'aggregated_query',
    keywords: ['近期任务', '这周有啥', '今天任务', '今日概览', '最近安排', '近期安排'],
  },
  {
    intent: 'checkin_feedback',
    keywords: ['今天看完了', '有点吃力', '打卡', '反馈', '完成', '进度', '汇报', '总结'],
  },
  {
    intent: 'review_start',
    keywords: ['考完了', '这次怎么样', '开始复习', '进入复习', '复习模式', '刷题', '练习'],
  },
  {
    intent: 'boundary',
    keywords: ['食堂', '天气', '吃', '玩', '聊天', '你好', '嗨', '在吗', '你是谁', '功能', '帮助'],
  },
]

/**
 * 通过关键词匹配识别用户意图
 * @param message 用户输入消息
 * @returns 意图类型枚举值
 */
export function detectIntent(message: string): IntentType {
  const lowerMsg = message.toLowerCase()

  for (const rule of intentRules) {
    if (rule.keywords.some((keyword) => lowerMsg.includes(keyword.toLowerCase()))) {
      return rule.intent
    }
  }

  // 默认返回课程查询意图
  return 'course_query'
}

/**
 * 获取所有意图规则（供编排引擎和边界处理使用）
 */
export function getIntentRules() {
  return intentRules
}

/**
 * 从用户消息中提取死线相关信息
 */
export function extractDeadlineInfo(message: string): { subject?: string; days?: number; date?: string } {
  const result: { subject?: string; days?: number; date?: string } = {}

  const dayMatches = message.match(/(\d+)天后/)
  if (dayMatches) {
    result.days = parseInt(dayMatches[1])
  }

  const dateMatches = message.match(/(\d+)月(\d+)日/)
  if (dateMatches) {
    result.date = `${dateMatches[1]}-${dateMatches[2]}`
  }

  const weekMatches = message.match(/(周一|周二|周三|周四|周五|周六|周日|今天|明天|后天)/)
  if (weekMatches) {
    const weekMap: Record<string, number> = {
      '今天': 0,
      '明天': 1,
      '后天': 2,
      '周一': 1,
      '周二': 2,
      '周三': 3,
      '周四': 4,
      '周五': 5,
      '周六': 6,
      '周日': 0,
    }
    const today = new Date().getDay()
    const targetDay = weekMap[weekMatches[1]]
    if (targetDay !== undefined) {
      let diff = targetDay - today
      if (diff <= 0) diff += 7
      result.days = diff
    }
  }

  const courseKeywords = ['高数', '数学', '物理', '英语', '计算机', '编程', '数据结构', '算法', '线代', '线性代数', '概率', '统计学', '化学', '生物', '历史', '地理', '政治']
  for (const keyword of courseKeywords) {
    if (message.includes(keyword)) {
      result.subject = keyword
      break
    }
  }

  return result
}
