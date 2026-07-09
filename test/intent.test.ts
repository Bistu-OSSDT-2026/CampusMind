import { describe, it, expect } from '@jest/globals'
import { detectIntent, extractDeadlineInfo } from '@/lib/intent'

describe('意图识别模块', () => {
  describe('detectIntent', () => {
    it('应该识别计划生成意图', () => {
      expect(detectIntent('帮我生成复习计划')).toBe('plan_generate')
      expect(detectIntent('我要冲刺备考')).toBe('plan_generate')
      expect(detectIntent('快炸了，帮我规划一下')).toBe('plan_generate')
    })

    it('应该识别死线创建意图', () => {
      expect(detectIntent('周五考高数')).toBe('deadline_create')
      expect(detectIntent('设个提醒，后天交作业')).toBe('deadline_create')
      expect(detectIntent('下周三DDL')).toBe('deadline_create')
    })

    it('应该识别课程查询意图', () => {
      expect(detectIntent('下节课是什么')).toBe('course_query')
      expect(detectIntent('今天有几节课')).toBe('course_query')
      expect(detectIntent('课表发给我')).toBe('course_query')
    })

    it('应该识别汇总查询意图', () => {
      expect(detectIntent('今天有什么任务')).toBe('aggregated_query')
      expect(detectIntent('今日概览')).toBe('aggregated_query')
      expect(detectIntent('这周有啥安排')).toBe('aggregated_query')
    })

    it('应该识别打卡反馈意图', () => {
      expect(detectIntent('今天看完了')).toBe('checkin_feedback')
      expect(detectIntent('打卡完成')).toBe('checkin_feedback')
      expect(detectIntent('汇报进度')).toBe('checkin_feedback')
    })

    it('应该识别开始复习意图', () => {
      expect(detectIntent('开始复习')).toBe('review_start')
      expect(detectIntent('进入复习模式')).toBe('review_start')
      expect(detectIntent('刷题练习')).toBe('review_start')
    })

    it('应该识别边界意图', () => {
      expect(detectIntent('食堂在哪')).toBe('boundary')
      expect(detectIntent('你好')).toBe('boundary')
      expect(detectIntent('心情好差')).toBe('boundary')
    })

    it('未知输入应默认返回课程查询', () => {
      expect(detectIntent('这是什么')).toBe('course_query')
      expect(detectIntent('')).toBe('course_query')
    })
  })

  describe('extractDeadlineInfo', () => {
    it('应该提取天数', () => {
      expect(extractDeadlineInfo('3天后考高数')).toEqual(expect.objectContaining({ days: 3 }))
    })

    it('应该提取日期', () => {
      expect(extractDeadlineInfo('12月25日考试')).toEqual(expect.objectContaining({ date: '12-25' }))
    })

    it('应该提取星期', () => {
      const result = extractDeadlineInfo('周五考高数')
      expect(result.days).toBeDefined()
      expect(typeof result.days).toBe('number')
    })

    it('应该提取科目', () => {
      expect(extractDeadlineInfo('周五考高数')).toEqual(expect.objectContaining({ subject: '高数' }))
      expect(extractDeadlineInfo('英语考试')).toEqual(expect.objectContaining({ subject: '英语' }))
      expect(extractDeadlineInfo('数据结构作业')).toEqual(expect.objectContaining({ subject: '数据结构' }))
    })

    it('应该同时提取多个信息', () => {
      const result = extractDeadlineInfo('周五考高数')
      expect(result.subject).toBe('高数')
      expect(result.days).toBeDefined()
    })

    it('无法提取信息时应返回空对象', () => {
      expect(extractDeadlineInfo('这是什么')).toEqual({})
    })
  })
})