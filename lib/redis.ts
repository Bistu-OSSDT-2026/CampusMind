import Redis from 'ioredis'

let redisClient: Redis | null = null

export const getRedis = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redisClient = new Redis(redisUrl)
    redisClient.on('error', () => {})
  }
  return redisClient
}

export const getSessionKey = (sessionId: string) => `session:${sessionId}`
export const getUserKey = (userId: string) => `user:${userId}`
export const getIdempotencyKey = (key: string) => `idempotency:${key}`