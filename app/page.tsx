'use client'

import { useState, useEffect, useCallback } from 'react'
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
    const interval = setInterval(loadSidebarData, 60000)
    return () => clearInterval(interval)
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <Sidebar todayCourses={todayCourses} urgentDeadlines={urgentDeadlines} />

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <div
        className={`lg:hidden fixed left-0 top-0 h-full w-80 bg-white z-50 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h1 className="text-lg font-bold">GuardGPA</h1>
            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <h2 className="font-semibold text-gray-700 text-sm">今日课程</h2>
              </div>
              {todayCourses.length === 0 ? (
                <p className="text-gray-400 text-sm">今天没有课程</p>
              ) : (
                <div className="space-y-2">
                  {todayCourses.map((course) => (
                    <div key={course.id} className="p-3 bg-gray-50 rounded-xl">
                      <h3 className="font-medium text-sm">{course.name}</h3>
                      {course.location && <p className="text-xs text-gray-500">{course.location}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 bg-red-500 rounded-full" />
                <h2 className="font-semibold text-gray-700 text-sm">紧迫死线</h2>
              </div>
              {urgentDeadlines.length === 0 ? (
                <p className="text-gray-400 text-sm">暂无紧迫任务</p>
              ) : (
                <div className="space-y-2">
                  {urgentDeadlines.map((deadline) => (
                    <div key={deadline.id} className="p-3 bg-white border border-gray-100 rounded-xl">
                      <h3 className="font-medium text-sm">{deadline.subject}</h3>
                      <p className="text-xs text-gray-500">{deadline.type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 lg:hidden">
          <h1 className="text-lg font-bold text-gray-800">GuardGPA</h1>
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