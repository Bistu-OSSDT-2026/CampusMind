import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/courses/next - 查询下节课
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json(
        { code: 1, message: '缺少 X-User-Id 请求头' },
        { status: 400 }
      );
    }

    const now = new Date();
    let weekday = now.getDay();
    weekday = weekday === 0 ? 7 : weekday;

    // 当前时间对应的大致节次（假设每节课45分钟，8:00开始）
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // 节次时间映射（简化版）
    const periodStartMinutes: Record<number, number> = {
      1: 8 * 60,        // 08:00
      2: 8 * 60 + 50,   // 08:50
      3: 9 * 60 + 50,   // 09:50
      4: 10 * 60 + 40,  // 10:40
      5: 11 * 60 + 30,  // 11:30
      6: 14 * 60,       // 14:00
      7: 14 * 60 + 50,  // 14:50
      8: 15 * 60 + 50,  // 15:50
      9: 16 * 60 + 40,  // 16:40
      10: 17 * 60 + 30, // 17:30
      11: 19 * 60,      // 19:00
      12: 19 * 60 + 50, // 19:50
    };

    // 估算当前节次
    let currentPeriod = 0;
    for (let p = 12; p >= 1; p--) {
      if (currentTotalMinutes >= periodStartMinutes[p]) {
        currentPeriod = p;
        break;
      }
    }

    // 查询今天剩余课程：start_period > currentPeriod
    const todayCourses = await prisma.course.findMany({
      where: {
        user_id: userId,
        weekday,
        start_period: { gt: currentPeriod },
      },
      orderBy: { start_period: 'asc' },
      take: 1,
    });

    if (todayCourses.length > 0) {
      const c = todayCourses[0];
      return NextResponse.json({
        code: 0,
        data: {
          course_id: c.id,
          name: c.name,
          teacher: c.teacher,
          location: c.location,
          weekday: c.weekday,
          start_period: c.start_period,
          end_period: c.end_period,
          week_range: c.week_range,
          date: now.toISOString().split('T')[0],
        },
      });
    }

    // 今天没有剩余课程，查找未来7天的课程
    for (let offset = 1; offset <= 7; offset++) {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + offset);
      let futureWeekday = futureDate.getDay();
      futureWeekday = futureWeekday === 0 ? 7 : futureWeekday;

      const futureCourses = await prisma.course.findMany({
        where: {
          user_id: userId,
          weekday: futureWeekday,
        },
        orderBy: { start_period: 'asc' },
        take: 1,
      });

      if (futureCourses.length > 0) {
        const c = futureCourses[0];
        return NextResponse.json({
          code: 0,
          data: {
            course_id: c.id,
            name: c.name,
            teacher: c.teacher,
            location: c.location,
            weekday: c.weekday,
            start_period: c.start_period,
            end_period: c.end_period,
            week_range: c.week_range,
            date: futureDate.toISOString().split('T')[0],
          },
        });
      }
    }

    // 没有找到任何课程
    return NextResponse.json({
      code: 0,
      data: null,
      message: '暂无即将到来的课程',
    });
  } catch (error) {
    console.error('查询下节课失败:', error);
    return NextResponse.json(
      { code: 1, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
