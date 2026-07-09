import { IntentType } from '@/types'

// 关键词匹配规则：按优先级排列，先匹配到的优先返回
const intentRules: { intent: IntentType; keywords: string[] }[] = [
  {
    intent: 'plan_generate',
    keywords: ['帮我复习', '生成计划', '快炸了', '复习计划'],
  },
  {
    intent: 'deadline_create',
    keywords: ['设个提醒', '考', '作业', '截止', 'ddl', 'DDL', '死线'],
  },
  {
    intent: 'course_query',
    keywords: ['下节课', '在哪上课', '今天有几节课', '课表', '上课'],
  },
  {
    intent: 'aggregated_query',
    keywords: ['近期任务', '这周有啥', '今天任务'],
  },
  {
    intent: 'checkin_feedback',
    keywords: ['今天看完了', '有点吃力', '打卡'],
  },
  {
    intent: 'review_start',
    keywords: ['考完了', '这次怎么样'],
  },
  {
    intent: 'boundary',
    keywords: ['食堂', '天气', '吃', '玩', '聊天', '你好', '嗨'],
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
    for (const keyword of rule.keywords) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        return rule.intent
      }
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
