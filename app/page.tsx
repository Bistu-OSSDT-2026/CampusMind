'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Message, Course, Deadline, ToolAction } from '@/types'
import { api } from '@/lib/api'
import { Sidebar } from '@/components/Sidebar'
import { MessageList } from '@/components/MessageList'
import { ChatInput } from '@/components/ChatInput'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [todayCourses, setTodayCourses] = useState<Course[]>([])
  const [urgentDeadlines, setUrgentDeadlines] = useState<Deadline[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  // 多账号切换
  const [currentUserId, setCurrentUserId] = useState<string>('test-user-1')
  const [showUserSwitch, setShowUserSwitch] = useState(false)
  const [newUserId, setNewUserId] = useState('')

  // 初始化：从 localStorage 读取用户ID
  useEffect(() => {
    const saved = localStorage.getItem('campusmind-user-id')
    if (saved) setCurrentUserId(saved)
  }, [])

  const loadSidebarData = useCallback(async () => {
    try {
      const [coursesRes, deadlinesRes] = await Promise.all([
        api.courses.today(),
        api.deadlines.urgent(),
      ])
      if (coursesRes.code === 0) {
        setTodayCourses(coursesRes.data || [])
      }
      if (deadlinesRes.code === 0) {
        setUrgentDeadlines(deadlinesRes.data || [])
      }
    } catch (err) {
      console.error('Failed to load sidebar data:', err)
    }
  }, [])

  useEffect(() => {
    loadSidebarData()
  }, [loadSidebarData])

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }

    try {
      const response = await api.dialog.message(content, sessionId)

      if (response.code === 0) {
        const { session_id, reply, intent, actions } = response.data

        setSessionId(session_id)

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: reply,
          intent,
          actions: actions as ToolAction[],
          createdAt: new Date().toISOString(),
        }

        setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id))
        setMessages((prev) => [...prev, assistantMessage])

        loadSidebarData()
      } else {
        throw new Error(response.message || '请求失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误，请重试')
      setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id))
    } finally {
        setIsLoading(false)
      }
    }

    const handleQuickAction = (text: string) => {
      setInputMessage(text)
      setTimeout(() => {
        handleSend(text)
      }, 100)
    }

    const handleDeadlineComplete = async (ddlId: string) => {
      try {
        await api.deadlines.complete(ddlId)
      } catch {
        console.error('Failed to complete deadline via API')
      } finally {
        setUrgentDeadlines((prev) => prev.filter((d) => d.ddl_id !== ddlId))
      }
    }

    const handleDeadlineExtend = async (ddlId: string) => {
      const newTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      try {
        await api.deadlines.update(ddlId, { deadline_time: newTime })
      } catch {
        console.error('Failed to extend deadline via API')
      } finally {
        setUrgentDeadlines((prev) =>
          prev.map((d) =>
            d.ddl_id === ddlId
              ? { ...d, deadline_time: newTime, countdown_days: d.countdown_days + 1 }
              : d
          )
        )
      }
    }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-teal-50/20">
      <Sidebar
        todayCourses={todayCourses}
        urgentDeadlines={urgentDeadlines}
        onQuickAction={handleQuickAction}
        onDeadlineComplete={handleDeadlineComplete}
        onDeadlineExtend={handleDeadlineExtend}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">CampusMind</h1>
          <div className="relative">
            <button
              onClick={() => setShowUserSwitch(!showUserSwitch)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {currentUserId}
            </button>
            {showUserSwitch && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
                <p className="text-xs text-gray-500 mb-2">切换账号（输入用户ID）</p>
                <div className="flex gap-2">
                  <input
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newUserId.trim()) {
                        localStorage.setItem('campusmind-user-id', newUserId.trim())
                        setCurrentUserId(newUserId.trim())
                        setNewUserId('')
                        setShowUserSwitch(false)
                        setMessages([])
                        setSessionId(undefined)
                        loadSidebarData()
                      }
                    }}
                    placeholder="输入用户ID"
                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <button
                    onClick={() => {
                      if (newUserId.trim()) {
                        localStorage.setItem('campusmind-user-id', newUserId.trim())
                        setCurrentUserId(newUserId.trim())
                        setNewUserId('')
                        setShowUserSwitch(false)
                        setMessages([])
                        setSessionId(undefined)
                        loadSidebarData()
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    切换
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  当前：{currentUserId}
                </div>
              </div>
            )}
          </div>
        </header>

        <MessageList
          messages={messages}
          loadingMessage={isLoading ? {
            id: `loading-${Date.now()}`,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
          } : null}
        />

        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </main>
    </div>
  )
}