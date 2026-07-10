import { useState, useRef, useCallback, useEffect } from 'react'
import { Course, Deadline } from '@/types'

interface SidebarProps {
  todayCourses: Course[]
  urgentDeadlines: Deadline[]
  onQuickAction: (text: string) => void
  onDeadlineComplete?: (ddlId: string) => void
  onDeadlineExtend?: (ddlId: string) => void
}

const weekdayMap = ['日', '一', '二', '三', '四', '五', '六']

const deadlineTypeLabels: Record<string, string> = {
  homework: '作业',
  exam: '考试',
  other: '其他',
}

const deadlineTypeColors: Record<string, string> = {
  homework: 'bg-primary-100 text-primary-700',
  exam: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
}

const deadlineTypeBgColors: Record<string, string> = {
  homework: 'bg-primary-50/80 border-primary-100',
  exam: 'bg-red-50/80 border-red-100',
  other: 'bg-gray-50/80 border-gray-100',
}

const getDnLabel = (countdownDays: number) => {
  if (countdownDays === 0) return { text: 'D-0', className: 'bg-red-500 text-white' }
  if (countdownDays === 1) return { text: 'D-1', className: 'bg-orange-500 text-white' }
  if (countdownDays <= 3) return { text: `D-${countdownDays}`, className: 'bg-amber-500 text-white' }
  if (countdownDays <= 7) return { text: `D-${countdownDays}`, className: 'bg-primary-500 text-white' }
  return { text: `${countdownDays}天后`, className: 'bg-gray-500 text-white' }
}

const formatPeriod = (startPeriod: number, endPeriod: number) => {
  const periodTimes: Record<number, string> = {
    1: '08:00',
    2: '08:55',
    3: '10:00',
    4: '10:55',
    5: '12:00',
    6: '13:30',
    7: '14:25',
    8: '15:30',
    9: '16:25',
    10: '17:30',
    11: '18:30',
    12: '19:25',
  }
  const start = periodTimes[startPeriod] || `${startPeriod * 60 + 480}`
  const endTime = periodTimes[endPeriod + 1] || `${(endPeriod + 1) * 60 + 480}`
  return `${start}-${endTime}`
}

const getWeekNumber = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  return Math.ceil(diff / oneWeek)
}

const quickActions = [
  { text: '下节课是什么？', icon: '📅' },
  { text: '帮我生成复习计划', icon: '📋' },
  { text: '今天有什么任务？', icon: '📝' },
  { text: '开始复习', icon: '🎯' },
]

export function Sidebar({ todayCourses, urgentDeadlines, onQuickAction, onDeadlineComplete, onDeadlineExtend }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [width, setWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [expandedDeadline, setExpandedDeadline] = useState<string | null>(null)
  const [hoveredProgress, setHoveredProgress] = useState<string | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const minWidth = 60
  const maxWidth = 340
  const expandedWidth = 320

  useEffect(() => {
    setWidth(isCollapsed ? minWidth : expandedWidth)
  }, [isCollapsed])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sidebarRef.current) return
      const containerRect = sidebarRef.current.parentElement?.getBoundingClientRect()
      if (!containerRect) return
      const newWidth = e.clientX - containerRect.left
      setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
      setIsCollapsed(false)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      if (width < 150) {
        setIsCollapsed(true)
        setWidth(minWidth)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, width])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const today = new Date()
  const weekNumber = getWeekNumber(today)
  const todayStr = `${today.getMonth() + 1}月${today.getDate()}日 周${weekdayMap[today.getDay()]}`

  const completedCount = urgentDeadlines.filter(d => d.status === 'completed').length

  return (
    <aside
      ref={sidebarRef}
      className="bg-white border-r border-gray-100 flex flex-col h-full lg:flex transition-all duration-200 relative"
      style={{ width: `${width}px`, minWidth: `${minWidth}px` }}
    >
      <div className="p-4 border-b border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className={`transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden flex-shrink-0' : 'opacity-100'}`}>
            <h1 className="text-lg font-bold text-gray-800">CampusMind</h1>
            <p className="text-xs text-gray-400 mt-1">第{weekNumber}周 · {todayStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-bold">🎓</span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 z-10"
              title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        <nav className={`mt-4 flex gap-2 transition-all duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <a
            href="/"
            className="flex-1 text-xs py-2 px-3 bg-primary-50 text-primary-600 rounded-lg text-center font-medium"
          >
            对话
          </a>
          <a
            href="/courses"
            className="flex-1 text-xs py-2 px-3 bg-gray-50 text-gray-600 rounded-lg text-center font-medium hover:bg-gray-100 transition-colors"
          >
            课程管理
          </a>
        </nav>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-6 transition-opacity duration-200 scrollbar-custom ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
            <h2 className="font-semibold text-gray-700 text-sm">今日课程</h2>
            <span className="ml-auto text-xs text-gray-400">{todayCourses.length}节</span>
          </div>

          {todayCourses.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-primary-50 to-teal-50 rounded-2xl flex items-center justify-center animate-float shadow-sm">
                <svg viewBox="0 0 64 64" className="w-12 h-12">
                  <rect x="16" y="28" width="32" height="24" rx="4" fill="#0D9488" />
                  <rect x="20" y="32" width="8" height="16" rx="2" fill="#14B8A6" />
                  <rect x="36" y="32" width="8" height="16" rx="2" fill="#14B8A6" />
                  <path d="M24 28 L16 16 L48 16 L40 28" fill="#0D9488" />
                  <path d="M16 16 L16 8 C16 4 20 4 24 8 L24 16" stroke="#0D9488" strokeWidth="3" fill="none" />
                  <path d="M48 16 L48 8 C48 4 44 4 40 8 L40 16" stroke="#0D9488" strokeWidth="3" fill="none" />
                  <circle cx="32" cy="40" r="4" fill="#FBBF24" />
                  <rect x="28" y="48" width="8" height="4" rx="2" fill="#F59E0B" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-2">今天可以自由安排时间啦~</p>
              <button
                onClick={() => onQuickAction('帮我生成一份今日的自习计划')}
                className="text-xs text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-all duration-200 hover:scale-105"
              >
                要不要我帮你生成自习计划？
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="p-3 bg-primary-50/50 rounded-xl hover:bg-primary-50 transition-colors cursor-pointer border border-primary-100/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm">{course.name}</h3>
                      {course.teacher && (
                        <p className="text-xs text-gray-500 mt-0.5">{course.teacher}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                      {formatPeriod(course.start_period, course.end_period)}
                    </span>
                  </div>
                  {course.location && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {course.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 bg-red-500 rounded-full" />
            <h2 className="font-semibold text-gray-700 text-sm">紧迫死线</h2>
            <span className="ml-auto text-xs text-gray-400">{urgentDeadlines.length - completedCount}项待完成</span>
          </div>

          {urgentDeadlines.length === 0 ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center animate-pulse">
                <svg viewBox="0 0 64 64" className="w-10 h-10">
                  <circle cx="32" cy="32" r="20" fill="#10B981" />
                  <path d="M22 32 L28 38 L42 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">暂无紧迫任务</p>
            </div>
          ) : (
            <div className="space-y-2">
              {urgentDeadlines.map((deadline) => {
                const dn = getDnLabel(deadline.countdown_days)
                const isExpanded = expandedDeadline === deadline.ddl_id
                const isCompleted = deadline.status === 'completed'

                return (
                  <div
                    key={deadline.ddl_id}
                    className={`rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                      isCompleted
                        ? 'bg-gray-50 opacity-60'
                        : `${deadlineTypeBgColors[deadline.type]} border hover:shadow-md hover:-translate-y-0.5`
                    }`}
                    onClick={() => setExpandedDeadline(isExpanded ? null : deadline.ddl_id)}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${deadlineTypeColors[deadline.type]}`}>
                              {deadlineTypeLabels[deadline.type]}
                            </span>
                            <h3 className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {deadline.subject}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(deadline.deadline_time).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${dn.className}`}>
                          {dn.text}
                        </span>
                      </div>
                      {deadline.weight > 1 && (
                        <div className="mt-2 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i < deadline.weight ? 'bg-primary-400' : 'bg-gray-200'
                              }`}
                              onMouseEnter={() => setHoveredProgress(deadline.ddl_id)}
                              onMouseLeave={() => setHoveredProgress(null)}
                            />
                          ))}
                          <div className="relative ml-2">
                            {hoveredProgress === deadline.ddl_id && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-30">
                                已完成 {deadline.weight}/5 个小步骤
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {isExpanded && !isCompleted && (
                      <div className="px-3 pb-3 pt-0 border-t border-gray-100/50 mt-2 animate-fadeIn">
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Complete button clicked for:', deadline.ddl_id)
                              onDeadlineComplete?.(deadline.ddl_id)
                            }}
                            className="flex-1 text-xs py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            ✓ 标记完成
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Extend button clicked for:', deadline.ddl_id)
                              onDeadlineExtend?.(deadline.ddl_id)
                            }}
                            className="flex-1 text-xs py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            ⏱ 延期一天
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="bg-gradient-to-br from-primary-50 to-teal-50 rounded-2xl p-4">
          <h3 className="font-semibold text-primary-800 text-sm mb-3">💡 快捷指令</h3>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.text}
                onClick={() => onQuickAction(action.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 hover:bg-white text-xs text-gray-600 rounded-full transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 border border-primary-100/50"
              >
                <span>{action.icon}</span>
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className={`p-4 border-t border-gray-100 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>测试模式</span>
          <span>v1.0</span>
        </div>
      </div>

      <div
        className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize flex flex-col items-center justify-center transition-colors z-20 ${
          isDragging ? 'bg-primary-400' : 'hover:bg-gray-300'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="w-1 h-8 bg-gray-400 rounded-full" />
      </div>
    </aside>
  )
}