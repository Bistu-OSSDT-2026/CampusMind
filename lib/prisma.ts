import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
  var prismaAvailable: boolean | undefined
}

export const prisma = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

/** 检查数据库是否可用（首次检测后缓存结果） */
let _dbChecked = false
export async function isDbAvailable(): Promise<boolean> {
  if (_dbChecked && globalThis.prismaAvailable !== undefined) {
    return globalThis.prismaAvailable
  }
  try {
    await prisma.$queryRaw`SELECT 1`
    globalThis.prismaAvailable = true
  } catch {
    globalThis.prismaAvailable = false
  }
  _dbChecked = true
  return globalThis.prismaAvailable as boolean
}