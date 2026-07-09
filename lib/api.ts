import { Message, Course, Deadline, Plan } from '@/types'

const BASE_URL = '/api'
const USER_ID = process.env.NEXT_PUBLIC_USER_ID || 'test-user-1'

const headers = {
  'Content-Type': 'application/json',
  'X-User-Id': USER_ID,
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface DialogResponse {
  session_id: string
  reply: string
  intent: string
  actions: {
    tool: string
    action: string
    result: string
  }[]
  next_steps?: string[]
  urgent_deadline?: Deadline
}

export const api = {
  dialog: {
    message: async (message: string, sessionId?: string): Promise<ApiResponse<DialogResponse>> => {
      const body = { message, session_id: sessionId }
      const res = await fetch(`${BASE_URL}/dialog/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      return res.json()
    },
    history: async (): Promise<ApiResponse<Message[]>> => {
      const res = await fetch(`${BASE_URL}/dialog/history`, { headers })
      return res.json()
    },
    session: async (): Promise<ApiResponse<any>> => {
      const res = await fetch(`${BASE_URL}/dialog/session`, { headers })
      return res.json()
    },
    endSession: async (): Promise<ApiResponse<void>> => {
      const res = await fetch(`${BASE_URL}/dialog/session`, { method: 'DELETE', headers })
      return res.json()
    },
  },

  courses: {
    list: async (page = 1, size = 20): Promise<ApiResponse<Course[]>> => {
      const res = await fetch(`${BASE_URL}/courses?page=${page}&size=${size}`, { headers })
      return res.json()
    },
    today: async (): Promise<ApiResponse<Course[]>> => {
      const res = await fetch(`${BASE_URL}/courses/today`, { headers })
      return res.json()
    },
    next: async (): Promise<ApiResponse<Course | null>> => {
      const res = await fetch(`${BASE_URL}/courses/next`, { headers })
      return res.json()
    },
    availableSlots: async (startDate: string, endDate: string): Promise<ApiResponse<any>> => {
      const res = await fetch(`${BASE_URL}/courses/available-slots?start_date=${startDate}&end_date=${endDate}`, { headers })
      return res.json()
    },
    create: async (course: Omit<Course, 'id' | 'created_at'>): Promise<ApiResponse<Course>> => {
      const res = await fetch(`${BASE_URL}/courses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(course),
      })
      return res.json()
    },
  },

  deadlines: {
    list: async (): Promise<ApiResponse<Deadline[]>> => {
      const res = await fetch(`${BASE_URL}/deadlines`, { headers })
      return res.json()
    },
    urgent: async (): Promise<ApiResponse<Deadline[]>> => {
      const res = await fetch(`${BASE_URL}/deadlines/urgent`, { headers })
      return res.json()
    },
    create: async (deadline: Omit<Deadline, 'id' | 'countdown_days' | 'created_at'>): Promise<ApiResponse<Deadline>> => {
      const res = await fetch(`${BASE_URL}/deadlines`, {
        method: 'POST',
        headers,
        body: JSON.stringify(deadline),
      })
      return res.json()
    },
    update: async (id: string, deadline: Partial<Deadline>): Promise<ApiResponse<Deadline>> => {
      const res = await fetch(`${BASE_URL}/deadlines/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(deadline),
      })
      return res.json()
    },
    complete: async (id: string): Promise<ApiResponse<Deadline>> => {
      const res = await fetch(`${BASE_URL}/deadlines/${id}/complete`, {
        method: 'PUT',
        headers,
      })
      return res.json()
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const res = await fetch(`${BASE_URL}/deadlines/${id}`, {
        method: 'DELETE',
        headers,
      })
      return res.json()
    },
  },

  plans: {
    generate: async (ddlId: string, dailyHoursLimit?: number): Promise<ApiResponse<Plan>> => {
      const body = { ddl_id: ddlId, daily_hours_limit: dailyHoursLimit || 4 }
      const res = await fetch(`${BASE_URL}/plans/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      return res.json()
    },
    list: async (): Promise<ApiResponse<Plan[]>> => {
      const res = await fetch(`${BASE_URL}/plans`, { headers })
      return res.json()
    },
    today: async (): Promise<ApiResponse<any>> => {
      const res = await fetch(`${BASE_URL}/plans/today`, { headers })
      return res.json()
    },
  },
}