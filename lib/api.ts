import { Message, Course, Deadline, Plan } from '@/types'

const BASE_URL = '/api'

/** 获取当前用户ID（优先从 localStorage 读取，支持多账号切换） */
function getUserId(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('campusmind-user-id') || process.env.NEXT_PUBLIC_USER_ID || 'test-user-1'
  }
  return process.env.NEXT_PUBLIC_USER_ID || 'test-user-1'
}

/** 获取请求头（动态读取当前用户ID） */
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-User-Id': getUserId(),
})

const FETCH_TIMEOUT = 30000
const MAX_RETRIES = 2

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

export interface ApiError extends Error {
  status?: number
  code?: number
}

function createApiError(message: string, status?: number, code?: number): ApiError {
  const error = new Error(message) as ApiError
  error.status = status
  error.code = code
  return error
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

async function safeFetch<T>(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<ApiResponse<T>> {
  try {
    const response = await fetchWithTimeout(url, options)

    if (!response.ok) {
      try {
        const errorBody = await response.json()
        throw createApiError(
          errorBody.message || `HTTP error! status: ${response.status}`,
          response.status,
          errorBody.code
        )
      } catch {
        throw createApiError(`HTTP error! status: ${response.status}`, response.status)
      }
    }

    const data = await response.json()
    
    if (data.code !== undefined && data.code !== 0) {
      throw createApiError(data.message || 'API error', response.status, data.code)
    }

    return data as ApiResponse<T>
  } catch (error) {
    if (retries > 0 && (error instanceof Error && error.name === 'AbortError')) {
      return safeFetch(url, options, retries - 1)
    }
    throw error
  }
}

export const api = {
  dialog: {
    message: async (message: string, sessionId?: string): Promise<ApiResponse<DialogResponse>> => {
      try {
        const body = { message, session_id: sessionId }
        return await safeFetch<DialogResponse>(`${BASE_URL}/dialog/message`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        })
      } catch (error) {
        console.error('[API] dialog.message failed:', error)
        throw error
      }
    },
    history: async (): Promise<ApiResponse<Message[]>> => {
      try {
        return await safeFetch<Message[]>(`${BASE_URL}/dialog/history`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] dialog.history failed:', error)
        throw error
      }
    },
    session: async (): Promise<ApiResponse<any>> => {
      try {
        return await safeFetch(`${BASE_URL}/dialog/session`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] dialog.session failed:', error)
        throw error
      }
    },
    endSession: async (): Promise<ApiResponse<void>> => {
      try {
        return await safeFetch<void>(`${BASE_URL}/dialog/session`, { method: 'DELETE', headers: getHeaders() })
      } catch (error) {
        console.error('[API] dialog.endSession failed:', error)
        throw error
      }
    },
  },

  courses: {
    list: async (page = 1, size = 20): Promise<ApiResponse<Course[]>> => {
      try {
        return await safeFetch<Course[]>(`${BASE_URL}/courses?page=${page}&size=${size}`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] courses.list failed:', error)
        throw error
      }
    },
    all: async (): Promise<ApiResponse<Course[]>> => {
      try {
        return await safeFetch<Course[]>(`${BASE_URL}/courses`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] courses.all failed:', error)
        throw error
      }
    },
    today: async (): Promise<ApiResponse<Course[]>> => {
      try {
        return await safeFetch<Course[]>(`${BASE_URL}/courses/today`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] courses.today failed:', error)
        throw error
      }
    },
    next: async (): Promise<ApiResponse<Course | null>> => {
      try {
        return await safeFetch<Course | null>(`${BASE_URL}/courses/next`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] courses.next failed:', error)
        throw error
      }
    },
    availableSlots: async (startDate: string, endDate: string): Promise<ApiResponse<any>> => {
      try {
        return await safeFetch(`${BASE_URL}/courses/available-slots?start_date=${startDate}&end_date=${endDate}`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] courses.availableSlots failed:', error)
        throw error
      }
    },
    create: async (course: Omit<Course, 'course_id' | 'created_at'>): Promise<ApiResponse<Course>> => {
      try {
        return await safeFetch<Course>(`${BASE_URL}/courses`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(course),
        })
      } catch (error) {
        console.error('[API] courses.create failed:', error)
        throw error
      }
    },
    update: async (id: string, course: Partial<Course>): Promise<ApiResponse<Course>> => {
      try {
        return await safeFetch<Course>(`${BASE_URL}/courses/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(course),
        })
      } catch (error) {
        console.error('[API] courses.update failed:', error)
        throw error
      }
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      try {
        return await safeFetch<void>(`${BASE_URL}/courses/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        })
      } catch (error) {
        console.error('[API] courses.delete failed:', error)
        throw error
      }
    },
  },

  deadlines: {
    list: async (): Promise<ApiResponse<Deadline[]>> => {
      try {
        return await safeFetch<Deadline[]>(`${BASE_URL}/deadlines`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] deadlines.list failed:', error)
        throw error
      }
    },
    urgent: async (): Promise<ApiResponse<Deadline[]>> => {
      try {
        return await safeFetch<Deadline[]>(`${BASE_URL}/deadlines/urgent`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] deadlines.urgent failed:', error)
        throw error
      }
    },
    create: async (deadline: Omit<Deadline, 'id' | 'countdown_days' | 'created_at'>): Promise<ApiResponse<Deadline>> => {
      try {
        return await safeFetch<Deadline>(`${BASE_URL}/deadlines`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(deadline),
        })
      } catch (error) {
        console.error('[API] deadlines.create failed:', error)
        throw error
      }
    },
    update: async (id: string, deadline: Partial<Deadline>): Promise<ApiResponse<Deadline>> => {
      try {
        return await safeFetch<Deadline>(`${BASE_URL}/deadlines/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(deadline),
        })
      } catch (error) {
        console.error('[API] deadlines.update failed:', error)
        throw error
      }
    },
    complete: async (id: string): Promise<ApiResponse<Deadline>> => {
      try {
        return await safeFetch<Deadline>(`${BASE_URL}/deadlines/${id}/complete`, {
          method: 'PUT',
          headers: getHeaders(),
        })
      } catch (error) {
        console.error('[API] deadlines.complete failed:', error)
        throw error
      }
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      try {
        return await safeFetch<void>(`${BASE_URL}/deadlines/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        })
      } catch (error) {
        console.error('[API] deadlines.delete failed:', error)
        throw error
      }
    },
  },

  plans: {
    generate: async (ddlId: string, dailyHoursLimit?: number): Promise<ApiResponse<Plan>> => {
      try {
        const body = { ddl_id: ddlId, daily_hours_limit: dailyHoursLimit || 4 }
        return await safeFetch<Plan>(`${BASE_URL}/plans/generate`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        })
      } catch (error) {
        console.error('[API] plans.generate failed:', error)
        throw error
      }
    },
    list: async (): Promise<ApiResponse<Plan[]>> => {
      try {
        return await safeFetch<Plan[]>(`${BASE_URL}/plans`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] plans.list failed:', error)
        throw error
      }
    },
    today: async (): Promise<ApiResponse<any>> => {
      try {
        return await safeFetch(`${BASE_URL}/plans/today`, { headers: getHeaders() })
      } catch (error) {
        console.error('[API] plans.today failed:', error)
        throw error
      }
    },
  },
}