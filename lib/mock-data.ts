export interface MockCourse {
  id: string
  name: string
  teacher: string
  location: string
  weekday: number
  start_period: number
  end_period: number
  week_range: string
  created_at: string
}

const CREATED_AT = '2026-07-01T08:00:00Z'

export const mockCourses: MockCourse[] = [
  { id: 'course-math-mon', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 1, start_period: 1, end_period: 2, week_range: '1-16', created_at: CREATED_AT },
  { id: 'course-math-wed', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 3, start_period: 1, end_period: 2, week_range: '1-16', created_at: CREATED_AT },
  { id: 'course-math-fri', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 5, start_period: 1, end_period: 2, week_range: '1-16', created_at: CREATED_AT },
  { id: 'course-phy-tue', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 2, start_period: 3, end_period: 4, week_range: '1-16', created_at: CREATED_AT },
  { id: 'course-phy-thu', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 4, start_period: 3, end_period: 4, week_range: '1-16', created_at: CREATED_AT },
  { id: 'course-lin-tue', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 2, start_period: 6, end_period: 7, week_range: '1-16', created_at: CREATED_AT },
  { id: 'course-lin-fri', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 5, start_period: 6, end_period: 7, week_range: '1-16', created_at: CREATED_AT },
]

export const getTodayWeekday = (): number => {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}