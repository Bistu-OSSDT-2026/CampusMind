export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: string
  actions?: ToolAction[]
  createdAt: string
}

export interface ToolAction {
  tool: 'course' | 'deadline' | 'plan' | 'checkin' | 'review'
  action: 'query' | 'create' | 'update' | 'delete' | 'start' | 'generate'
  result: string
}

export interface Course {
  course_id: string
  name: string
  teacher?: string
  location?: string
  weekday: number
  start_period: number
  end_period: number
  week_range?: string
  created_at: string
}

export interface Deadline {
  ddl_id: string
  type: 'homework' | 'exam' | 'other'
  subject: string
  course_id?: string
  deadline_time: string
  countdown_days: number
  weight: number
  status: 'pending' | 'completed' | 'expired'
  description?: string
  created_at: string
}

export interface Plan {
  plan_id: string
  subject: string
  exam_date: string
  status: 'draft' | 'active' | 'completed' | 'canceled'
  daily_hours_limit: number
  generated_at: string
  tasks: DailyTask[]
}

export interface DailyTask {
  task_id: string
  date: string
  knowledge_points: string[]
  time_slot?: string
  duration_minutes: number
  status: 'pending' | 'in_progress' | 'completed'
}

export interface AvailableSlot {
  date: string
  time_ranges: string[]
}

export type IntentType =
  | 'course_query'
  | 'course_create'
  | 'course_delete'
  | 'deadline_create'
  | 'deadline_delete'
  | 'plan_generate'
  | 'checkin_feedback'
  | 'review_start'
  | 'aggregated_query'
  | 'boundary'

export interface OrchestrationResult {
  reply: string
  intent: IntentType
  actions: ToolAction[]
  urgent_deadline?: Deadline
}
