import { useEffect, useRef } from 'react'
import { Message } from '@/types'
import { ChatMessage } from './ChatMessage'

interface MessageListProps {
  messages: Message[]
  loadingMessage?: Message | null
}

export function MessageList({ messages, loadingMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loadingMessage])

  const displayMessages = loadingMessage ? [...messages, loadingMessage] : messages

  if (displayMessages.length === 0) {
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎓</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">欢迎使用 GuardGPA</h3>
          <p className="text-gray-500 text-sm">
            我是你的学业规划助手，可以帮你查询课表、设置死线、生成复习计划。<br />
            试试问我：「下节课是什么？」或「帮我生成复习计划」
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {displayMessages.map((message, index) => (
          <ChatMessage
            key={message.id || `msg-${index}`}
            message={message}
            isLoading={loadingMessage?.id === message.id}
          />
        ))}
      </div>
    </div>
  )
}