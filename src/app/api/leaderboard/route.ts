import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll } from '@/lib/db'
import type { LeaderboardEntry } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const groupId = new URL(request.url).searchParams.get('group_id')
  const db = getDb()

  const entries = groupId
    ? await queryAll<LeaderboardEntry>(
        db,
        `SELECT l.*
         FROM leaderboard l
         INNER JOIN user_group_members ugm ON ugm.user_id = l.user_id
         WHERE ugm.group_id = ?
         ORDER BY l.total_points DESC, l.exact_results DESC, l.username ASC`,
        [groupId],
      )
    : await queryAll<LeaderboardEntry>(
        db,
        `SELECT * FROM leaderboard ORDER BY total_points DESC, exact_results DESC, username ASC`,
      )

  return NextResponse.json({ success: true, data: { entries, currentUserId: userId } })
}
