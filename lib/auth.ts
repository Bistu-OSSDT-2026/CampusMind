import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const AUTH_SECRET = process.env.AUTH_SECRET || 'campusmind-secret-key-change-in-production'
const TOKEN_SEPARATOR = '.'

/** 密码哈希（scrypt） */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = await new Promise<Buffer>((resolve, reject) => {
    require('crypto').scrypt(password, salt, 64, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
  return `${salt}:${key.toString('hex')}`
}

/** 验证密码 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':')
  const keyBuffer = Buffer.from(key, 'hex')
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    require('crypto').scrypt(password, salt, 64, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
  return timingSafeEqual(keyBuffer, derivedKey)
}

/** 创建认证 token（userId.timestamp.hmac） */
export function createToken(userId: string): string {
  const timestamp = Date.now().toString(36)
  const payload = `${userId}${TOKEN_SEPARATOR}${timestamp}`
  const hmac = createHash('sha256').update(`${payload}${TOKEN_SEPARATOR}${AUTH_SECRET}`).digest('hex').slice(0, 32)
  return `${payload}${TOKEN_SEPARATOR}${hmac}`
}

/** 验证 token，返回 userId 或 null */
export function verifyToken(token: string): string | null {
  try {
    const parts = token.split(TOKEN_SEPARATOR)
    if (parts.length !== 3) return null
    const [userId, timestamp, hmac] = parts
    const expectedHmac = createHash('sha256')
      .update(`${userId}${TOKEN_SEPARATOR}${timestamp}${TOKEN_SEPARATOR}${AUTH_SECRET}`)
      .digest('hex').slice(0, 32)
    if (hmac !== expectedHmac) return null
    // Token 有效期 30 天
    const tokenAge = Date.now() - parseInt(timestamp, 36)
    if (tokenAge > 30 * 24 * 60 * 60 * 1000) return null
    return userId
  } catch {
    return null
  }
}

/** 从请求中获取当前用户 ID */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

/** Cookie 配置 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 天
}
