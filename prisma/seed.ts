import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_USER_ID = 'test-user-1'

function getDateOfWeek(weekday: number): Date {
  const today = new Date()
  today.setHours(9, 0, 0, 0)
  const currentWeekday = today.getDay() === 0 ? 7 : today.getDay()
  let diff = weekday - currentWeekday
  if (diff < 0) diff += 7
  const target = new Date(today)
  target.setDate(today.getDate() + diff)
  return target
}

async function main() {
  console.log('🧹 清理旧的演示数据...')
  await prisma.dailyTask.deleteMany({})
  await prisma.plan.deleteMany({})
  await prisma.dialogMessage.deleteMany({})
  await prisma.dialogSession.deleteMany({})
  await prisma.deadline.deleteMany({ where: { user_id: TEST_USER_ID } })
  await prisma.course.deleteMany({ where: { user_id: TEST_USER_ID } })

  console.log('👤 创建测试用户...')
  await prisma.user.upsert({
    where: { user_id: TEST_USER_ID },
    update: { nickname: '校园学霸', school: '北京信息科技大学', major: '计算机科学与技术', grade: '2024', daily_hours_limit: 4 },
    create: { user_id: TEST_USER_ID, nickname: '校园学霸', school: '北京信息科技大学', major: '计算机科学与技术', grade: '2024', daily_hours_limit: 4 },
  })

  console.log('📚 预置 3 门课程...')
  const courses = [
    { course_id: 'course-math-mon', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 1, start_period: 1, end_period: 2 },
    { course_id: 'course-math-wed', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 3, start_period: 1, end_period: 2 },
    { course_id: 'course-math-fri', name: '高等数学', teacher: '张教授', location: '教学楼A101', weekday: 5, start_period: 1, end_period: 2 },
    { course_id: 'course-phy-tue', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 2, start_period: 3, end_period: 4 },
    { course_id: 'course-phy-thu', name: '大学物理', teacher: '李教授', location: '物理系楼B203', weekday: 4, start_period: 3, end_period: 4 },
    { course_id: 'course-lin-tue', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 2, start_period: 6, end_period: 7 },
    { course_id: 'course-lin-fri', name: '线性代数', teacher: '王教授', location: '数学楼C305', weekday: 5, start_period: 6, end_period: 7 },
  ]

  for (const c of courses) {
    await prisma.course.upsert({
      where: { course_id: c.course_id },
      update: {},
      create: { ...c, user_id: TEST_USER_ID, week_range: '1-16' },
    })
  }

  console.log('⏰ 预置 3 个死线（2 作业 + 1 考试场景）...')
  const tuesday = getDateOfWeek(2)
  const wednesday = getDateOfWeek(3)
  const friday = getDateOfWeek(5)

  const deadlines = [
    { ddl_id: 'ddl-math-homework', type: 'homework', subject: '高数作业 P132', course_id: 'course-math-mon', deadline_time: tuesday, weight: 4, description: '完成习题 P132 第 1-10 题' },
    { ddl_id: 'ddl-physics-report', type: 'homework', subject: '物理实验报告', course_id: 'course-phy-tue', deadline_time: wednesday, weight: 3, description: '提交力学实验报告' },
    { ddl_id: 'ddl-math-exam', type: 'exam', subject: '高数考试', course_id: 'course-math-mon', deadline_time: friday, weight: 5, description: '期中考试（考试场景：周五 09:00）' },
  ]

  for (const d of deadlines) {
    await prisma.deadline.upsert({
      where: { ddl_id: d.ddl_id },
      update: { type: d.type, subject: d.subject, course_id: d.course_id, deadline_time: d.deadline_time, weight: d.weight, status: 'pending', description: d.description },
      create: { ...d, user_id: TEST_USER_ID, status: 'pending' },
    })
  }

  console.log('✅ Seed 数据创建完成！')
  console.log(`   用户: ${TEST_USER_ID}`)
  console.log(`   课程: ${courses.length} 条（高等数学 / 大学物理 / 线性代数）`)
  console.log(`   死线: ${deadlines.length} 条（2 作业 + 1 考试）`)
}

main().catch((e) => { console.error('❌ Seed 失败:', e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })