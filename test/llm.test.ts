import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { generateReviewPlan, analyzeWeakPoints, getMinimalFallback } from '@/lib/llm'

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify({
            plan_name: '测试计划',
            daily_tasks: [{
              day: 1,
              date: '2026-07-10',
              title: '第一天复习',
              knowledge_points: ['极限'],
              exercises: ['习题1'],
              duration_hours: 2,
              priority: 'high'
            }],
            total_hours: 2
          })} }]
        })
      }
    }
  }))
}))

describe('LLM模块', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateReviewPlan', () => {
    it('无API Key时应返回降级计划', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'your-openai-api-key'

      const result = await generateReviewPlan('高数', 3)

      expect(result.plan_name).toBe('高数冲刺复习计划')
      expect(result.daily_tasks.length).toBe(3)
      expect(result.total_hours).toBe(12)

      process.env.OPENAI_API_KEY = originalKey
    })

    it('API调用成功时应返回LLM生成的计划', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'sk-test-key'

      const result = await generateReviewPlan('高数', 3)

      expect(result.plan_name).toBe('测试计划')
      expect(result.daily_tasks.length).toBe(1)
      expect(result.total_hours).toBe(2)

      process.env.OPENAI_API_KEY = originalKey
    })

    it('应正确计算天数', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'your-openai-api-key'

      const result = await generateReviewPlan('高数', 5)

      expect(result.daily_tasks.length).toBe(5)

      process.env.OPENAI_API_KEY = originalKey
    })

    it('最后一天应安排模拟考试', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'your-openai-api-key'

      const result = await generateReviewPlan('高数', 3)
      const lastTask = result.daily_tasks[result.daily_tasks.length - 1]

      expect(lastTask.title).toBe('模拟考试与错题回顾')
      expect(lastTask.knowledge_points).toContain('模拟考试')

      process.env.OPENAI_API_KEY = originalKey
    })
  })

  describe('analyzeWeakPoints', () => {
    it('无API Key时应返回默认薄弱点', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'your-openai-api-key'

      const result = await analyzeWeakPoints('高数', '我觉得中值定理很难')

      expect(result).toEqual(['中值定理', '积分计算'])

      process.env.OPENAI_API_KEY = originalKey
    })

    it('应返回数组格式的薄弱点', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'your-openai-api-key'

      const result = await analyzeWeakPoints('高数', '')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      process.env.OPENAI_API_KEY = originalKey
    })
  })

  describe('getMinimalFallback', () => {
    it('应返回最小化降级计划', () => {
      const result = getMinimalFallback('高数', 3)

      expect(result.plan_name).toBe('高数复习计划')
      expect(result.daily_tasks.length).toBe(1)
      expect(result.total_hours).toBe(2)
    })
  })
})