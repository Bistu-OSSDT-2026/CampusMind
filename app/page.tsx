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

    const handleQuickAction = (text: string) => {
      setInputMessage(text)
      setTimeout(() => {
        handleSend(text)
      }, 100)
    }

    const handleDeadlineComplete = async (ddlId: string) => {
      try {
        await api.deadlines.complete(ddlId)
        loadSidebarData()
      } catch {
        console.error('Failed to complete deadline')
      }
    }

    const handleDeadlineExtend = async (ddlId: string) => {
      try {
        await api.deadlines.update(ddlId, { deadline_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
        loadSidebarData()
      } catch {
        console.error('Failed to extend deadline')
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
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 lg:hidden">
          <h1 className="text-lg font-bold text-gray-800">CampusMind</h1>
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