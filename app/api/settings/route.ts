import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getSettings, updateSettings, Settings } from '@/lib/settings-store'

export function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')

  logger.api.request('GET', '/settings', userId)

  if (!userId) {
    logger.api.response('GET', '/settings', 400, { code: -1, message: '缺少用户ID' })
    return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
  }

  const settings = getSettings()

  const responseData = {
    code: 0,
    message: 'success',
    data: settings,
  }

  logger.api.response('GET', '/settings', 200, responseData)

  return NextResponse.json(responseData)
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id')
    const body = await request.json()

    logger.api.request('PUT', '/settings', userId, body)

    if (!userId) {
      logger.api.response('PUT', '/settings', 400, { code: -1, message: '缺少用户ID' })
      return NextResponse.json({ code: -1, message: '缺少用户ID' }, { status: 400 })
    }

    const updates: Partial<Settings> = {}

    if (body.firstWeekStartDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(body.firstWeekStartDate)) {
        logger.api.response('PUT', '/settings', 400, { code: -1, message: '起始周日期格式无效，应为YYYY-MM-DD' })
        return NextResponse.json({ code: -1, message: '起始周日期格式无效，应为YYYY-MM-DD' }, { status: 400 })
      }

      const date = new Date(body.firstWeekStartDate)
      if (isNaN(date.getTime())) {
        logger.api.response('PUT', '/settings', 400, { code: -1, message: '起始周日期无效' })
        return NextResponse.json({ code: -1, message: '起始周日期无效' }, { status: 400 })
      }

      updates.firstWeekStartDate = body.firstWeekStartDate
    }

    const updatedSettings = updateSettings(updates)

    const responseData = {
      code: 0,
      message: 'success',
      data: updatedSettings,
    }

    logger.api.response('PUT', '/settings', 200, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('设置更新接口错误', error)
    logger.api.response('PUT', '/settings', 500, { code: -1, message: '服务器错误' })
    return NextResponse.json({ code: -1, message: '服务器错误' }, { status: 500 })
  }
}