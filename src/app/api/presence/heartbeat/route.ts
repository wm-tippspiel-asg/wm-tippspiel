import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryOne, execute } from '@/lib/db'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const username = request.headers.get('x-username') ?? 'Unknown'
  if (!userId) return NextResponse.json({ success: false }, { status: 401 })

  const db = getDb()

  const existing = await queryOne<{ last_seen: string; total_seconds: number }>(
    db,
    `SELECT last_seen, total_seconds FROM user_presence WHERE user_id = ?`,
    [userId],
  )

  if (existing) {
    const elapsedSec = Math.round(
      (Date.now() - new Date(existing.last_seen + 'Z').getTime()) / 1000,
    )
    if (elapsedSec <= 120) {
      await execute(
        db,
        `UPDATE user_presence SET last_seen = datetime('now'), total_seconds = total_seconds + ? WHERE user_id = ?`,
        [Math.min(elapsedSec, 120), userId],
      )
    } else {
      await execute(
        db,
        `UPDATE user_presence SET last_seen = datetime('now'), session_start = datetime('now') WHERE user_id = ?`,
        [userId],
      )
    }
  } else {
    await execute(
      db,
      `INSERT INTO user_presence (user_id, username, last_seen, session_start, total_seconds) VALUES (?, ?, datetime('now'), datetime('now'), 0)`,
      [userId, username],
    )
  }

  return NextResponse.json({ success: true })
}
