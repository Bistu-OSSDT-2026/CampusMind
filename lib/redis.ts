import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl)

export const getSessionKey = (sessionId: string) => `session:${sessionId}`
export const getUserKey = (userId: string) => `user:${userId}`
export const getIdempotencyKey = (key: string) => `idempotency:${key}`