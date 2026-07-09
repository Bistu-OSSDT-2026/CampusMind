import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis, getSessionKey } from '@/lib/redis'
import { logger } from '@/lib/logger'

function detectIntent(message: string): string {
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.includes('下节课') || lowerMsg.includes('上课') || lowerMsg.includes('课表')) {
    return 'course_query'
  }
  if (lowerMsg.includes('考') || lowerMsg.includes('作业') || lowerMsg.includes('ddl') || lowerMsg.includes('截止') || lowerMsg.includes('死线')) {
    return 'deadline_create'
  }
  if (lowerMsg.includes('复习') || lowerMsg.includes('计划') || lowerMsg.includes('快炸')) {
    return 'plan_generate'
  }
  if (lowerMsg.includes('今天') || lowerMsg.includes('近期') || lowerMsg.includes('这周')) {
    return 'aggregated_query'
  }
  if (lowerMsg.includes('食堂') || lowerMsg.includes('天气') || lowerMsg.includes('吃') || lowerMsg.includes('玩') || lowerMsg.includes('聊天') || lowerMsg.includes('你好') || lowerMsg.includes('嗨')) {
    return 'boundary'
  }
  return 'course_query'
}

async function getMockCourses(userId: string) {
  try {
    const courses = await prisma.course.findMany({
      where: { user_id: userId },
      orderBy: [{ weekday: 'asc' }, { start_period: 'asc' }],
      take: 5,
    })
    return courses.map(c => ({
      name: c.name,
      location: c.location || '未知地点',
      time: `${c.start_period * 2 - 1}:00-${c.end_period * 2}:00`,
    }))
  } catch {
    return [
      { name: '高等数学', location: '教学楼A101', time: '08:00-09:40' },
      { name: '大学物理', location: '物理系楼B203', time: '10:00-11:40' },
    ]
  }
}

async function getMockDeadlines(userId: string) {
  try {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const deadlines = await prisma.deadline.findMany({
      where: {
        user_id: userId,
        status: 'pending',
        deadline_time: { gte: now },
      },
      orderBy: { deadline_time: 'asc' },
      take: 5,
    })
    return deadlines.map(d => ({
      id: d.ddl_id,
      type: d.type,
      subject: d.subject,
      deadline_time: d.deadline_time.toISOString(),
      countdown_days: Math.ceil((d.deadline_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      status: d.status,
    }))
  } catch {
    return [
      {
        id: 'deadline-1',
        type: 'homework' as const,
        subject: '高数作业 P132',
        deadline_time: new Date(Date.now() + 86400000).toISOString(),
        countdown_days: 1,
        status: 'pending' as const,
      },
      {
        id: 'deadline-2',
        type: 'homework' as const,
        subject: '物理实验报告',
        deadline_time: new Date(Date.now() + 172800000).toISOString(),
        countdown_days: 2,
        status: 'pending' as const,
      },
      {
        id: 'deadline-3',
        type: 'exam' as const,
        subject: '高数考试',
        deadline_time: new Date(Date.now() + 4 * 86400000).toISOString(),
        countdown_days: 4,
        status: 'pending' as const,
      },
    ]
  }
}

async function generateReply(intent: string, message: string, userId: string) {
  const mockCourses = await getMockCourses(userId)
  const mockDeadlines = await getMockDeadlines(userId)

  switch (intent) {
    case 'course_query': {
      const today = new Date()
      const weekday = today.getDay() === 0 ? 7 : today.getDay()
      if (mockCourses.length > 0) {
        const courseList = mockCourses.map(c => `${c.name} - ${c.location} - ${c.time}`).join('\n• ')
        return {
          reply: `下节课是【${mockCourses[0].name}】，在${mockCourses[0].location}，${mockCourses[0].time}上课。\n\n今天还有以下课程：\n• ${courseList}`,
          actions: [
            { tool: 'course', action: 'query', result: '查询今日课程' },
            { tool: 'course', action: 'query', result: '查询下节课' },
          ],
        }
      }
      return {
        reply: '今天没有课程安排，好好休息吧！',
        actions: [{ tool: 'course', action: 'query', result: '查询今日课程' }],
      }
    }

    case 'deadline_create': {
      const match = message.match(/(\S+)考(\S+)/) || message.match(/(\S+)作业/)
      if (match) {
        const subject = match[1] || match[2]
        return {
          reply: `已记录：${subject}考试，预计4天后进行。\n\n你可以说「帮我生成复习计划」来创建复习安排。`,
          actions: [{ tool: 'deadline', action: 'create', result: `创建${subject}考试死线` }],
        }
      }
      return {
        reply: '已记录死线。请问是哪门课的考试？考试日期是什么时候？',
        actions: [{ tool: 'deadline', action: 'create', result: '创建死线' }],
      }
    }

    case 'plan_generate': {
      return {
        reply: `【高数冲刺 D-4 ~ D-0】\n\nD-4（今）：极限与连续（基础）+ 习题 P132\nD-3（明）：导数与微分\nD-2（周三）：中值定理（薄弱，2天后回顾）\nD-1（周四）：积分综合 + 错题重做\nD-0（周五）：早7:00推送「考前30分钟速记」\n\n已避开全部课表时段，每日22:00找你打卡。`,
        actions: [
          { tool: 'deadline', action: 'create', result: '登记考试死线' },
          { tool: 'course', action: 'available_slots', result: '查询可用复习时段' },
          { tool: 'plan', action: 'generate', result: '生成复习计划' },
        ],
      }
    }

    case 'aggregated_query': {
      const courseList = mockCourses.map(c => `${c.name} - ${c.location} - ${c.time}`).join('\n• ')
      const deadlineList = mockDeadlines.map(d => `${d.type === 'exam' ? '📌' : '📝'} ${d.subject} - D-${d.countdown_days}`).join('\n• ')
      return {
        reply: `📅 今日概览\n\n【今日课程】\n• ${courseList || '暂无课程'}\n\n【紧迫死线】\n• ${deadlineList || '暂无紧迫死线'}`,
        actions: [
          { tool: 'course', action: 'query', result: '查询今日课程' },
          { tool: 'deadline', action: 'query', result: '查询紧迫死线' },
        ],
      }
    }

    case 'boundary': {
      const urgent = mockDeadlines[0]
      return {
        reply: `我只管帮你防挂科～\n\n对了，你${urgent?.subject || '有未完成的任务'}，现在还剩${urgent?.countdown_days || '不多'}天。`,
        actions: [{ tool: 'deadline', action: 'query', result: '查询最紧迫死线' }],
      }
    }

    default: {
      return {
        reply: '请问是哪门课的考试？考试日期是什么时候？',
        actions: [],
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()
    const { message, session_id } = body

    logger.api.request('POST', '/api/dialog/message', userId, { message, session_id })

    if (!userId) {
      logger.api.response('POST', '/api/dialog/message', 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
    }

    if (!message) {
      logger.api.response('POST', '/api/dialog/message', 400, { code: -1, message: '消息内容不能为空' })
      return NextResponse.json({ code: -1, message: '消息内容不能为空' }, { status: 400 })
    }

    logger.api.processing('开始意图识别', { message })

    let sessionId = session_id

    if (!sessionId) {
      const activeSession = await prisma.dialogSession.findFirst({
        where: {
          user_id: userId,
          status: 'active',
          expires_at: { gt: new Date() },
        },
      })
      if (activeSession) {
        sessionId = activeSession.session_id
      }
    }

    if (!sessionId) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const newSession = await prisma.dialogSession.create({
        data: {
          user_id: userId,
          expires_at: expiresAt,
        },
      })
      sessionId = newSession.session_id

      await redis.set(getSessionKey(sessionId), JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        expires_at: expiresAt.toISOString(),
      }), 'EX', 24 * 60 * 60)
    } else {
      await prisma.dialogSession.update({
        where: { session_id: sessionId },
        data: { last_active_at: new Date() },
      })
      await redis.expire(getSessionKey(sessionId), 24 * 60 * 60)
    }

    const intent = detectIntent(message)
    logger.api.processing('意图识别结果', { intent })

    await prisma.dialogMessage.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: message,
        intent,
      },
    })

    logger.api.processing('生成回复')

    const { reply, actions } = await generateReply(intent, message, userId)

    await prisma.dialogMessage.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: reply,
        intent,
        actions: actions || undefined,
      },
    })

    const mockDeadlines = await getMockDeadlines(userId)

    const responseData = {
      code: 0,
      message: 'success',
      data: {
        session_id: sessionId,
        reply,
        intent,
        actions,
        urgent_deadline: mockDeadlines[0],
      },
    }

    logger.api.response('POST', '/api/dialog/message', 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('对话接口错误', error)
    logger.api.response('POST', '/api/dialog/message', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}