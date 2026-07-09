import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { execute } from '@/lib/orchestrator'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    course: {
      findMany: jest.fn().mockResolvedValue([
        { course_id: 'course-1', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 1, start_period: 1, end_period: 2 },
        { course_id: 'course-2', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 1, start_period: 3, end_period: 4 },
      ]),
    },
    deadline: {
      findMany: jest.fn().mockResolvedValue([
        { ddl_id: 'ddl-1', type: 'exam', subject: '高数考试', deadline_time: new Date(Date.now() + 4 * 86400000), weight: 5, status: 'pending', course_id: null, description: null, created_at: new Date() },
      ]),
      create: jest.fn().mockResolvedValue({ ddl_id: 'ddl-new', type: 'exam', subject: '新考试', deadline_time: new Date(), weight: 5, status: 'pending' }),
    },
  },
}))

jest.mock('@/lib/llm', () => ({
  generateReviewPlan: jest.fn().mockResolvedValue({
    plan_name: '测试复习计划',
    daily_tasks: [{
      day: 1,
      date: '2026-07-10',
      title: '第一天',
      knowledge_points: ['极限'],
      exercises: ['习题'],
      duration_hours: 4,
      priority: 'high'
    }],
    total_hours: 4
  }),
}))

jest.mock('@/lib/boundary', () => ({
  generateBoundaryReply: jest.fn().mockReturnValue({ reply: '边界回复', category: '闲聊' }),
}))

describe('编排引擎模块', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('course_query意图应返回课程信息', async () => {
      const result = await execute('course_query', '下节课是什么', 'test-user')

      expect(result.intent).toBe('course_query')
      expect(result.reply).toContain('高等数学')
      expect(result.actions).toBeDefined()
    })

    it('deadline_create意图应创建死线', async () => {
      const result = await execute('deadline_create', '周五考高数', 'test-user')

      expect(result.intent).toBe('deadline_create')
      expect(result.reply).toContain('高数')
      expect(result.reply).toContain('考试')
    })

    it('plan_generate意图应生成复习计划', async () => {
      const result = await execute('plan_generate', '帮我生成复习计划', 'test-user')

      expect(result.intent).toBe('plan_generate')
      expect(result.reply).toContain('测试复习计划')
      expect(result.actions).toBeDefined()
    })

    it('aggregated_query意图应返回汇总信息', async () => {
      const result = await execute('aggregated_query', '今日概览', 'test-user')

      expect(result.intent).toBe('aggregated_query')
      expect(result.reply).toContain('今日概览')
      expect(result.actions).toBeDefined()
    })

    it('checkin_feedback意图应返回打卡反馈', async () => {
      const result = await execute('checkin_feedback', '今天看完了', 'test-user')

      expect(result.intent).toBe('checkin_feedback')
      expect(result.reply).toContain('打卡完成')
    })

    it('review_start意图应返回复习建议', async () => {
      const result = await execute('review_start', '开始复习', 'test-user')

      expect(result.intent).toBe('review_start')
      expect(result.reply).toContain('复习')
    })

    it('boundary意图应返回边界回复', async () => {
      const result = await execute('boundary', '你好', 'test-user')

      expect(result.intent).toBe('boundary')
      expect(result.reply).toBe('边界回复')
    })
  })
})