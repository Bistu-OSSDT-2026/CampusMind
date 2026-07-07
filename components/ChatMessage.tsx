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

function highlightKeywords(text: string) {
  const parts: { text: string; isHighlighted: boolean; type: string }[] = []
  let remaining = text
  
  const patterns = [
    { regex: /\[D-\d+\]/g, type: 'deadline' },
    { regex: /\[今\]/g, type: 'today' },
    { regex: /\[明\]/g, type: 'tomorrow' },
    { regex: /\(薄弱\)/g, type: 'weak' },
    { regex: /（薄弱）/g, type: 'weak' },
    { regex: /\[考前[\d]+分钟\]/g, type: 'exam' },
  ]

  while (remaining.length > 0) {
    let earliestMatch: { index: number; match: string; type: string } | null = null
    
    for (const { regex, type } of patterns) {
      regex.lastIndex = 0
      const match = regex.exec(remaining)
      if (match && (!earliestMatch || match.index < earliestMatch.index)) {
        earliestMatch = { index: match.index, match: match[0], type }
      }
    }

    if (earliestMatch) {
      if (earliestMatch.index > 0) {
        parts.push({ text: remaining.slice(0, earliestMatch.index), isHighlighted: false, type: '' })
      }
      parts.push({ text: earliestMatch.match, isHighlighted: true, type: earliestMatch.type })
      remaining = remaining.slice(earliestMatch.index + earliestMatch.match.length)
    } else {
      parts.push({ text: remaining, isHighlighted: false, type: '' })
      break
    }
  }

  return parts
}

const highlightStyles: Record<string, string> = {
  deadline: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700',
  today: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700',
  tomorrow: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600',
  weak: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700',
  exam: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700',
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 py-2">
          <div className="text-sm text-primary-600 font-medium mr-2">AI思考中...</div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )
    }

    const parts = highlightKeywords(message.content)
    
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) =>
          part.isHighlighted ? (
            <span key={index} className={highlightStyles[part.type] || ''}>
              {part.text}
            </span>
          ) : (
            <span key={index}>{part.text}</span>
          )
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 animate-fadeIn ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
            : 'bg-gradient-to-br from-primary-400 to-teal-500 text-white'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-5 py-4 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-md'
              : 'bg-primary-50 text-gray-800 rounded-tl-md border border-primary-200'
          }`}
        >
          {renderContent()}
        </div>

        {message.actions && message.actions.length > 0 && !isLoading && (
          <div className={`mt-3 flex flex-wrap gap-2 ${isUser ? 'justify-end' : ''}`}>
            {message.actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors cursor-pointer"
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