import { useState, KeyboardEvent, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim())
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      setMessage(prev => prev + '\n')
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border-t border-gray-100 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，按 Enter 发送，Ctrl+Enter 换行..."
            disabled={isLoading}
            rows={1}
            className="w-full px-4 py-3 pr-12 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none transition-all duration-200 placeholder:text-gray-400"
            style={{ minHeight: '48px' }}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            message.trim() && !isLoading
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}