import { Message } from '@/types'

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
}

const toolIcons: Record<string, string> = {
  course: '📚',
  deadline: '⏰',
  plan: '📋',
  checkin: '✅',
  review: '🔍',
}

const actionLabels: Record<string, string> = {
  query: '查询',
  create: '创建',
  update: '更新',
  delete: '删除',
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex items-start gap-3 animate-fadeIn ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm'
              : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {message.actions && message.actions.length > 0 && !isLoading && (
          <div className={`mt-2 flex flex-wrap gap-2 ${isUser ? 'justify-end' : ''}`}>
            {message.actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs"
              >
                <span className="text-base">{toolIcons[action.tool] || '🔧'}</span>
                <span className="text-gray-600 font-medium">{action.tool}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-500">{actionLabels[action.action] || action.action}</span>
              </div>
            ))}
          </div>
        )}

        <span className={`mt-1 text-xs text-gray-400 ${isUser ? 'mr-1' : 'ml-1'}`}>
          {message.createdAt ? formatTime(message.createdAt) : new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}