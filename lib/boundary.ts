import type { Deadline } from '@/types'

// 边界内容子分类
type BoundaryCategory = 'life' | 'chat' | 'emotion' | 'entertainment' | 'social' | 'other'

// 分类关键词映射
const categoryKeywords: Record<BoundaryCategory, string[]> = {
  life: ['食堂', '天气', '吃什么', '去哪玩', '外卖', '快递', '超市', '宿舍', '洗衣', '洗澡'],
  chat: ['聊天', '你好', '嗨', '在吗', '你是谁', '功能', '帮助', '哈哈', '呵呵', '嘿嘿'],
  emotion: ['心情', '难过', '开心', '无聊', '好累', '好烦', '焦虑', '压力', '想哭', '崩溃', 'emo'],
  entertainment: ['游戏', '追剧', '电影', '综艺', '音乐', '唱歌', '逛街', '旅游', '刷视频', '看剧'],
  social: ['恋爱', '对象', '表白', '朋友', '聚会', '社团', '约会'],
  other: ['笑话', '故事', '算命', '星座', '占卜', '运势', '塔罗', 'MBTI'],
}

// 柔性拒绝前缀（按分类选择不同风格）
const rejectPrefixes: Record<BoundaryCategory, string[]> = {
  life: [
    '我只管帮你防挂科～',
    '这个超出我的能力范围啦～',
    '我是个学业助手，这个帮不了你～',
  ],
  chat: [
    '我只管帮你防挂科～',
    '我不是闲聊机器人哦～',
    '跟我聊学业才有意义～',
  ],
  emotion: [
    '我理解你的感受，不过我只管帮你防挂科～',
    '加油！不过我只能在学业上帮你～',
    '辛苦了！但学业方面我更擅长～',
  ],
  entertainment: [
    '我只管帮你防挂科～',
    '玩归玩，学业不能落下哦～',
    '先学完再玩，我帮你安排～',
  ],
  social: [
    '我只管帮你防挂科～',
    '社交的事情我帮不了，但学业可以～',
    '我只能在学业上帮你～',
  ],
  other: [
    '我只管帮你防挂科～',
    '这个超出我的能力范围啦～',
    '我是个学业助手，这个帮不了你～',
  ],
}

// 引导模板（根据是否有紧迫死线选择不同模板）
const guideTemplates = {
  withDeadline: [
    '对了，你{subject}，现在还剩{days}天。要不要我帮你生成复习计划？',
    '提醒一下，{subject}只剩{days}天了，需要我制定复习安排吗？',
    '话说{subject}还剩{days}天，赶紧复习吧！要我帮忙规划吗？',
  ],
  noDeadline: [
    '当前没有紧迫的考试或作业，有需要随时叫我！',
    '现在没有紧急任务，有学业问题随时找我～',
    '暂无紧迫死线，有课表或作业问题可以问我！',
  ],
  // 根据分类给出特定的学业引导
  categoryGuide: {
    life: '有课表或作业问题可以问我～',
    chat: '试试问我「下节课是什么」或「帮我复习高数」～',
    emotion: '调整好状态，学业上我能帮你～',
    entertainment: '先搞定学业再放松，效率更高～',
    social: '社交之余别忘了学业哦～',
    other: '有学业问题尽管问我～',
  },
}

/**
 * 分类边界内容
 */
export function classifyBoundary(message: string): BoundaryCategory {
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return category as BoundaryCategory
    }
  }
  return 'other'
}

/**
 * 生成边界回复（柔性拒绝 + 引导回学业场景）
 */
export function generateBoundaryReply(
  message: string,
  urgentDeadline?: Deadline
): { reply: string; category: BoundaryCategory } {
  const category = classifyBoundary(message)

  // 随机选择拒绝前缀
  const prefixes = rejectPrefixes[category]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]

  // 构造引导部分
  let guide = ''
  if (urgentDeadline) {
    const days = urgentDeadline.countdown_days
    const subject = urgentDeadline.subject
    const templates = guideTemplates.withDeadline
    guide = templates[Math.floor(Math.random() * templates.length)]
      .replace('{subject}', subject)
      .replace('{days}', String(days))
  } else {
    const templates = guideTemplates.noDeadline
    guide = templates[Math.floor(Math.random() * templates.length)]
  }

  // 添加分类引导
  const categoryGuide = guideTemplates.categoryGuide[category]

  return {
    reply: `${prefix}\n\n${guide}\n${categoryGuide}`,
    category,
  }
}
