import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      phone: '13800138000',
      nickname: '校园学霸',
      school: '北京信息科技大学',
      major: '计算机科学与技术',
      grade: '2024',
      daily_hours_limit: 4,
    },
  })

  const mathCourse = await prisma.course.upsert({
    where: { course_id: 'course-math' },
    update: {},
    create: {
      course_id: 'course-math',
      user_id: user.user_id,
      name: '高等数学',
      teacher: '张教授',
      location: '教学楼A101',
      weekday: 1,
      start_period: 1,
      end_period: 2,
      week_range: '1-16',
    },
  })

  const physicsCourse = await prisma.course.upsert({
    where: { course_id: 'course-physics' },
    update: {},
    create: {
      course_id: 'course-physics',
      user_id: user.user_id,
      name: '大学物理',
      teacher: '李教授',
      location: '物理系楼B203',
      weekday: 1,
      start_period: 3,
      end_period: 4,
      week_range: '1-16',
    },
  })

  const linearAlgebraCourse = await prisma.course.upsert({
    where: { course_id: 'course-linear-algebra' },
    update: {},
    create: {
      course_id: 'course-linear-algebra',
      user_id: user.user_id,
      name: '线性代数',
      teacher: '王教授',
      location: '数学楼C305',
      weekday: 2,
      start_period: 6,
      end_period: 7,
      week_range: '1-16',
    },
  })

  await prisma.deadline.upsert({
    where: { ddl_id: 'ddl-math-homework' },
    update: {},
    create: {
      ddl_id: 'ddl-math-homework',
      user_id: user.user_id,
      course_id: mathCourse.course_id,
      type: 'homework',
      subject: '高数作业 P132',
      deadline_time: new Date(Date.now() + 86400000),
      weight: 4,
      description: '完成习题 P132 第 1-10 题',
    },
  })

  await prisma.deadline.upsert({
    where: { ddl_id: 'ddl-physics-report' },
    update: {},
    create: {
      ddl_id: 'ddl-physics-report',
      user_id: user.user_id,
      course_id: physicsCourse.course_id,
      type: 'homework',
      subject: '物理实验报告',
      deadline_time: new Date(Date.now() + 172800000),
      weight: 3,
      description: '提交力学实验报告',
    },
  })

  await prisma.deadline.upsert({
    where: { ddl_id: 'ddl-math-exam' },
    update: {},
    create: {
      ddl_id: 'ddl-math-exam',
      user_id: user.user_id,
      course_id: mathCourse.course_id,
      type: 'exam',
      subject: '高数期中考试',
      deadline_time: new Date(Date.now() + 4 * 86400000),
      weight: 5,
      description: '期中考试',
    },
  })

  await prisma.deadline.upsert({
    where: { ddl_id: 'ddl-linear-algebra-exam' },
    update: {},
    create: {
      ddl_id: 'ddl-linear-algebra-exam',
      user_id: user.user_id,
      course_id: linearAlgebraCourse.course_id,
      type: 'exam',
      subject: '线性代数期末考试',
      deadline_time: new Date(Date.now() + 7 * 86400000),
      weight: 5,
      description: '期末考试',
    },
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })