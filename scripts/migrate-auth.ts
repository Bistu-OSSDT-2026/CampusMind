import { PrismaClient } from '@prisma/client'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${key.toString('hex')}`
}

async function main() {
  const prisma = new PrismaClient()

  try {
    // 查看现有用户
    const users = await prisma.user.findMany()
    console.log(`Found ${users.length} existing users:`, users.map(u => u.user_id))

    // 为每个现有用户设置 username 和 password_hash
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const username = user.nickname || `user${i + 1}`
      const passwordHash = await hashPassword('111111')

      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { username, password_hash: passwordHash },
      })
      console.log(`Updated user ${user.user_id} -> username: ${username}`)
    }

    // 创建默认 test 用户（如果不存在）
    const existing = await prisma.user.findFirst({ where: { username: 'test' } })
    if (!existing) {
      const testHash = await hashPassword('111111')
      await prisma.user.create({
        data: {
          username: 'test',
          password_hash: testHash,
          nickname: 'test',
        },
      })
      console.log('Created default test user')
    }

    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
