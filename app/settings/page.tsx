'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const [firstWeekStartDate, setFirstWeekStartDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await api.settings.get()
      if (response.code === 0) {
        setFirstWeekStartDate(response.data.firstWeekStartDate || '')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!firstWeekStartDate) {
      setMessage('请选择起始周日期')
      return
    }

    setIsSaving(true)
    setMessage('')

    try {
      const response = await api.settings.update({ firstWeekStartDate })
      if (response.code === 0) {
        setMessage('设置保存成功')
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setMessage(response.message || '保存失败')
      }
    } catch (error) {
      setMessage('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-teal-50/20">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">系统设置</h1>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                起始周（第一周）日期
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={firstWeekStartDate}
                  onChange={(e) => setFirstWeekStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                设置第一周的开始日期，系统将以此计算当前是第几周
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前周数计算
              </label>
              {firstWeekStartDate && (
                <div className="p-4 bg-primary-50 rounded-xl">
                  <p className="text-sm text-gray-600">
                    起始周：第1周（{firstWeekStartDate}）
                  </p>
                </div>
              )}
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}