export const logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    console.log(`\x1b[34m[INFO] ${timestamp}\x1b[0m ${message}`, data ? JSON.stringify(data, null, 2) : '')
  },
  
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    console.log(`\x1b[33m[WARN] ${timestamp}\x1b[0m ${message}`, data ? JSON.stringify(data, null, 2) : '')
  },
  
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString()
    console.log(`\x1b[31m[ERROR] ${timestamp}\x1b[0m ${message}`, error instanceof Error ? error.stack : (error ? JSON.stringify(error, null, 2) : ''))
  },
  
  success: (message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    console.log(`\x1b[32m[SUCCESS] ${timestamp}\x1b[0m ${message}`, data ? JSON.stringify(data, null, 2) : '')
  },
  
  api: {
    request: (method: string, path: string, userId: string | null, body?: any) => {
      const timestamp = new Date().toISOString()
      console.log(`\x1b[36m[API] ${timestamp}\x1b[0m ${method} ${path}`)
      console.log(`\x1b[36m[API]${'\x1b[0m'}   UserID: ${userId || 'N/A'}`)
      if (body) {
        console.log(`\x1b[36m[API]${'\x1b[0m'}   Body:`, JSON.stringify(body, null, 2))
      }
    },
    
    response: (method: string, path: string, status: number, data?: any) => {
      const timestamp = new Date().toISOString()
      const statusColor = status >= 200 && status < 300 ? '\x1b[32m' : status >= 400 ? '\x1b[31m' : '\x1b[33m'
      console.log(`\x1b[36m[API] ${timestamp}\x1b[0m ${method} ${path} -> ${statusColor}${status}\x1b[0m`)
      if (data) {
        console.log(`\x1b[36m[API]${'\x1b[0m'}   Response:`, JSON.stringify(data, null, 2))
      }
    },
    
    processing: (step: string, details?: any) => {
      const timestamp = new Date().toISOString()
      console.log(`\x1b[35m[PROCESS] ${timestamp}\x1b[0m ${step}`, details ? JSON.stringify(details, null, 2) : '')
    },
  },
}