'use client'

import { useState, useEffect } from 'react'
import { Course } from '@/types'

interface CourseFormProps {
  initialData?: Course | null
  onSubmit: (data: Omit<Course, 'course_id' | 'created_at'>) => void
  onSaveAndBack?: (data: Omit<Course, 'course_id' | 'created_at'>) => void
  onCancel: () => void
}

const weekDays = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
]

const periods = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `第${i + 1}节`,
}))

export function CourseForm({ initialData, onSubmit, onSaveAndBack, onCancel }: CourseFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    location: '',
    weekday: 1,
    start_period: 1,
    end_period: 2,
    week_range: '1-16',
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        teacher: initialData.teacher || '',
        location: initialData.location || '',
        weekday: initialData.weekday,
        start_period: initialData.start_period,
        end_period: initialData.end_period,
        week_range: initialData.week_range || '1-16',
      })
    }
  }, [initialData])

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent, saveAndBack = false) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('课程名称不能为空')
      return
    }
    if (formData.start_period >= formData.end_period) {
      alert('结束节次要大于开始节次')
      return
    }
    if (saveAndBack && onSaveAndBack) {
      onSaveAndBack(formData)
    } else {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            课程名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="例如：高等数学"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">授课教师</label>
          <input
            type="text"
            value={formData.teacher}
            onChange={(e) => handleChange('teacher', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="例如：张教授"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">上课地点</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="例如：教学楼A101"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">上课时间</label>
          <div className="flex items-center gap-2">
            <select
              value={formData.weekday}
              onChange={(e) => handleChange('weekday', parseInt(e.target.value))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              {weekDays.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <select
              value={formData.start_period}
              onChange={(e) => handleChange('start_period', parseInt(e.target.value))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="text-gray-400">~</span>
            <select
              value={formData.end_period}
              onChange={(e) => handleChange('end_period', parseInt(e.target.value))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              {periods.filter((p) => p.value > formData.start_period).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">周次范围</label>
          <input
            type="text"
            value={formData.week_range}
            onChange={(e) => handleChange('week_range', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="例如：1-16（表示第1周到第16周）"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
        >
          {initialData ? '保存修改' : '添加课程'}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          保存并返回
        </button>
      </div>
    </form>
  )
}