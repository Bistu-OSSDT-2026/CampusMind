import { Course, Deadline } from '@/types'

interface SidebarProps {
  todayCourses: Course[]
  urgentDeadlines: Deadline[]
}

const weekdayMap = ['日', '一', '二', '三', '四', '五', '六']

const deadlineTypeLabels: Record<string, string> = {
  homework: '作业',
  exam: '考试',
  other: '其他',
}

const deadlineTypeColors: Record<string, string> = {
  homework: 'bg-blue-100 text-blue-700',
  exam: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
}

const getDnLabel = (countdownDays: number) => {
  if (countdownDays === 0) return { text: 'D-0', className: 'bg-red-500 text-white' }
  if (countdownDays === 1) return { text: 'D-1', className: 'bg-orange-500 text-white' }
  if (countdownDays <= 3) return { text: `D-${countdownDays}`, className: 'bg-amber-500 text-white' }
  if (countdownDays <= 7) return { text: `D-${countdownDays}`, className: 'bg-blue-500 text-white' }
  return { text: `${countdownDays}天后`, className: 'bg-gray-500 text-white' }
}

const formatPeriod = (startPeriod: number, endPeriod: number) => {
  const periodTimes: Record<number, string> = {
    1: '08:00',
    2: '08:50',
    3: '09:50',
    4: '10:40',
    5: '11:30',
    6: '14:00',
    7: '14:50',
    8: '15:50',
    9: '16:40',
    10: '17:30',
    11: '19:00',
    12: '19:50',
  }
  const start = periodTimes[startPeriod] || `${startPeriod * 60 + 480}`
  const end = periodTimes[endPeriod] || `${endPeriod * 60 + 540}`
  return `${start}-${end}`
}

export function Sidebar({ todayCourses, urgentDeadlines }: SidebarProps) {
  const today = new Date()
  const todayStr = `${today.getMonth() + 1}月${today.getDate()}日 周${weekdayMap[today.getDay()]}`

  return (
    <aside className="w-80 bg-white border-r border-gray-100 flex flex-col h-full hidden lg:flex">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">GuardGPA</h1>
            <p className="text-xs text-gray-400 mt-1">{todayStr}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">🎓</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
            <h2 className="font-semibold text-gray-700 text-sm">今日课程</h2>
            <span className="ml-auto text-xs text-gray-400">{todayCourses.length}节</span>
          </div>

          {todayCourses.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              今天没有课程
            </div>
          ) : (
            <div className="space-y-2">
              {todayCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm">{course.name}</h3>
                      {course.teacher && (
                        <p className="text-xs text-gray-500 mt-0.5">{course.teacher}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
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
            <span className="ml-auto text-xs text-gray-400">{urgentDeadlines.length}项</span>
          </div>

          {urgentDeadlines.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              暂无紧迫任务
            </div>
          ) : (
            <div className="space-y-2">
              {urgentDeadlines.map((deadline) => {
                const dn = getDnLabel(deadline.countdown_days)
                return (
                  <div
                    key={deadline.id}
                    className={`p-3 rounded-xl transition-colors cursor-pointer ${
                      deadline.status === 'completed'
                        ? 'bg-gray-50 opacity-60'
                        : 'bg-white border border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${deadlineTypeColors[deadline.type]}`}>
                            {deadlineTypeLabels[deadline.type]}
                          </span>
                          <h3 className={`font-medium text-sm ${deadline.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
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
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${dn.className}`}>
                        {dn.text}
                      </span>
                    </div>
                    {deadline.weight > 1 && (
                      <div className="mt-2 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${i < deadline.weight ? 'bg-amber-400' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
          <h3 className="font-semibold text-blue-800 text-sm mb-2">💡 智能提示</h3>
          <p className="text-xs text-blue-600 leading-relaxed">
            试试说：「下节课是什么？」「周五考高数」「帮我生成复习计划」
          </p>
        </section>
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>测试模式</span>
          <span>v1.0</span>
        </div>
      </div>
    </aside>
  )
}