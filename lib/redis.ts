import Redis from 'ioredis'

let redisClient: Redis | null = null

export const getRedis = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      connectTimeout: 2000,
    })
    redisClient.on('error', () => {})
  }
  return redisClient
}

let _redisChecked = false
let _redisAvailable = false

/** 检查 Redis 是否可用（首次检测后缓存结果） */
export async function isRedisAvailable(): Promise<boolean> {
  if (_redisChecked) return _redisAvailable
  try {
    await getRedis().ping()
    _redisAvailable = true
  } catch {
    _redisAvailable = false
  }
  _redisChecked = true
  return _redisAvailable
}

export const getSessionKey = (sessionId: string) => `session:${sessionId}`
export const getUserKey = (userId: string) => `user:${userId}`
export const getIdempotencyKey = (key: string) => `idempotency:${key}`