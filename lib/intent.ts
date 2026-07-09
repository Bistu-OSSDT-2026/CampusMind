import { IntentType } from '@/types'

export type { IntentType }

/**
 * 意图识别规则配置
 * 规则按优先级排列：先匹配到的意图优先返回
 * 每条规则包含意图类型和对应的关键词列表
 */
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
    keywords: [
      '食堂', '天气', '吃什么', '去哪玩', '外卖', '快递', '超市', '宿舍', '洗衣', '洗澡',
      '聊天', '你好', '嗨', '在吗', '你是谁', '功能', '帮助', '哈哈', '呵呵', '嘿嘿',
      '心情', '难过', '开心', '无聊', '好累', '好烦', '焦虑', '压力', '想哭', '崩溃', 'emo',
      '游戏', '追剧', '电影', '综艺', '音乐', '唱歌', '逛街', '旅游', '刷视频', '看剧',
      '恋爱', '对象', '表白', '朋友', '聚会', '社团', '约会',
      '笑话', '故事', '算命', '星座', '占卜', '运势', '塔罗', 'MBTI',
    ],
  },
]

/**
 * 通过关键词匹配识别用户意图
 * 
 * 匹配逻辑：
 * 1. 将用户输入转换为小写
 * 2. 按优先级遍历意图规则
 * 3. 检查是否包含规则中的任意关键词
 * 4. 返回第一个匹配的意图，无匹配时默认返回课程查询意图
 * 
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

  return 'course_query'
}

/**
 * 获取所有意图规则
 * 供编排引擎和边界处理模块使用
 * 
 * @returns 意图规则列表
 */
export function getIntentRules() {
  return intentRules
}

/**
 * 从用户消息中提取死线相关信息
 * 
 * 提取策略：
 * 1. 天数格式："3天后" → 提取天数
 * 2. 日期格式："12月25日" → 提取日期
 * 3. 星期格式："周五"、"明天" → 计算天数偏移
 * 4. 科目关键词匹配：从预设课程列表中匹配科目名称
 * 
 * @param message 用户输入消息
 * @returns 包含科目、天数、日期的对象，未提取到的字段为undefined
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