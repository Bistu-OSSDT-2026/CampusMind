import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/courses/available-slots?start_date=&end_date=
// 计算可用复习时段
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json(
        { code: 1, message: '缺少 X-User-Id 请求头' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { code: 1, message: '缺少必填参数: start_date, end_date' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { code: 1, message: '日期格式无效，请使用 YYYY-MM-DD 格式' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { code: 1, message: 'start_date 不能晚于 end_date' },
        { status: 400 }
      );
    }

    // 获取用户所有课程
    const allCourses = await prisma.course.findMany({
      where: { user_id: userId },
    });

    // 按 weekday 分组
    const coursesByWeekday: Record<number, Array<{ start: number; end: number }>> = {};
    for (const c of allCourses) {
      if (!coursesByWeekday[c.weekday]) {
        coursesByWeekday[c.weekday] = [];
      }
      coursesByWeekday[c.weekday].push({
        start: c.start_period,
        end: c.end_period,
      });
    }

    // 定义全天可用时段（假设每天12节课）
    const fullDaySlots: Array<{ start: number; end: number }> = [
      { start: 1, end: 12 },
    ];

    // 计算某一天的可用时段
    function getAvailableSlotsForDay(weekday: number): Array<{ start: number; end: number }> {
      const dayCourses = coursesByWeekday[weekday] || [];
      if (dayCourses.length === 0) {
        // 全天无课，全天可用
        return [{ start: 1, end: 12 }];
      }

      // 按 start_period 排序
      const sorted = [...dayCourses].sort((a, b) => a.start - b.start);

      // 合并重叠的课程时段
      const merged: Array<{ start: number; end: number }> = [];
      for (const course of sorted) {
        if (merged.length === 0) {
          merged.push({ ...course });
        } else {
          const last = merged[merged.length - 1];
          if (course.start <= last.end + 1) {
            // 重叠或相邻，合并
            last.end = Math.max(last.end, course.end);
          } else {
            merged.push({ ...course });
          }
        }
      }

      // 从全天时段中减去课程时段
      const available: Array<{ start: number; end: number }> = [];
      let cursor = 1;

      for (const course of merged) {
        if (cursor < course.start) {
          available.push({ start: cursor, end: course.start - 1 });
        }
        cursor = Math.max(cursor, course.end + 1);
      }

      if (cursor <= 12) {
        available.push({ start: cursor, end: 12 });
      }

      return available;
    }

    // 遍历日期范围
    const result: Array<{
      date: string;
      weekday: number;
      available_slots: Array<{ start_period: number; end_period: number }>;
    }> = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      let weekday = current.getDay();
      weekday = weekday === 0 ? 7 : weekday;

      const slots = getAvailableSlotsForDay(weekday);

      result.push({
        date: current.toISOString().split('T')[0],
        weekday,
        available_slots: slots.map((s) => ({
          start_period: s.start,
          end_period: s.end,
        })),
      });

      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({
      code: 0,
      data: {
        start_date: startDateStr,
        end_date: endDateStr,
        daily_slots: result,
      },
    });
  } catch (error) {
    console.error('计算可用时段失败:', error);
    return NextResponse.json(
      { code: 1, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
