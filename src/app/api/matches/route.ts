import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll } from '@/lib/db'
import type { Match } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  const db = getDb()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const round = searchParams.get('round')

  let sql = 'SELECT * FROM matches WHERE 1=1'
  const params: unknown[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (round) {
    sql += ' AND round = ?'
    params.push(round)
  }

  sql += ' ORDER BY match_time ASC'

  const matches = await queryAll<Match>(db, sql, params)

  return NextResponse.json({ success: true, data: matches })
}
