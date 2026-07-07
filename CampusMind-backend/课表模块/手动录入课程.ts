import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/courses - 手动录入课程
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json(
        { code: 1, message: '缺少 X-User-Id 请求头' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, teacher, location, weekday, start_period, end_period, week_range } = body;

    // 参数校验
    if (!name || weekday === undefined || start_period === undefined || end_period === undefined) {
      return NextResponse.json(
        { code: 1, message: '缺少必填字段: name, weekday, start_period, end_period' },
        { status: 400 }
      );
    }

    if (weekday < 1 || weekday > 7) {
      return NextResponse.json(
        { code: 1, message: 'weekday 必须在 1-7 之间' },
        { status: 400 }
      );
    }

    if (start_period < 1 || end_period < 1 || start_period > end_period) {
      return NextResponse.json(
        { code: 1, message: 'start_period 和 end_period 必须为正整数，且 start_period <= end_period' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        name,
        teacher: teacher || null,
        location: location || null,
        weekday,
        start_period,
        end_period,
        week_range: week_range || null,
        user_id: userId,
      },
    });

    return NextResponse.json(
      {
        code: 0,
        data: {
          course_id: course.course_id,
          name: course.name,
          teacher: course.teacher,
          location: course.location,
          weekday: course.weekday,
          start_period: course.start_period,
          end_period: course.end_period,
          week_range: course.week_range,
          user_id: course.user_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建课程失败:', error);
    return NextResponse.json(
      { code: 1, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// GET /api/courses - 查询课表列表，支持分页
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '10', 10);

    const skip = (page - 1) * pageSize;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: { user_id: userId },
        orderBy: [{ weekday: 'asc' }, { start_period: 'asc' }],
        skip,
        take: pageSize,
      }),
      prisma.course.count({
        where: { user_id: userId },
      }),
    ]);

    return NextResponse.json({
      code: 0,
      data: {
        courses: courses.map((c: { course_id: string; name: string; teacher: string | null; location: string | null; weekday: number; start_period: number; end_period: number; week_range: string | null; user_id: string }) => ({
          course_id: c.course_id,
          name: c.name,
          teacher: c.teacher,
          location: c.location,
          weekday: c.weekday,
          start_period: c.start_period,
          end_period: c.end_period,
          week_range: c.week_range,
          user_id: c.user_id,
        })),
        pagination: {
          page,
          page_size: pageSize,
          total,
          total_pages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('查询课程列表失败:', error);
    return NextResponse.json(
      { code: 1, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
