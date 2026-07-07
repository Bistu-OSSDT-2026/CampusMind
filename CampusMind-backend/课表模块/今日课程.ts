import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/courses/today - 查询今日课程
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json(
        { code: 1, message: '缺少 X-User-Id 请求头' },
        { status: 400 }
      );
    }

    // 获取今天的星期几（1=周一, 7=周日）
    const now = new Date();
    let weekday = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
    // 转换为 1=周一, 7=周日
    weekday = weekday === 0 ? 7 : weekday;

    const courses = await prisma.course.findMany({
      where: {
        user_id: userId,
        weekday,
      },
      orderBy: { start_period: 'asc' },
    });

    return NextResponse.json({
      code: 0,
      data: {
        date: now.toISOString().split('T')[0],
        weekday,
        courses: courses.map((c: { course_id: string; name: string; teacher: string | null; location: string | null; weekday: number; start_period: number; end_period: number; week_range: string | null }) => ({
          course_id: c.course_id,
          name: c.name,
          teacher: c.teacher,
          location: c.location,
          weekday: c.weekday,
          start_period: c.start_period,
          end_period: c.end_period,
          week_range: c.week_range,
        })),
      },
    });
  } catch (error) {
    console.error('查询今日课程失败:', error);
    return NextResponse.json(
      { code: 1, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
