import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll } from '@/lib/db'
import type { LeaderboardEntry, GroupStanding } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view')      // 'groups' → Gruppenwertung
  const groupId = searchParams.get('group_id') // Filter Einzelwertung by group
  const db = getDb()

  // --- Gruppenwertung: Gruppen nach Gesamtpunkten ihrer Mitglieder ---
  if (view === 'groups') {
    const standings = await queryAll<GroupStanding>(
      db,
      `SELECT ug.id, ug.name, ug.description,
              COUNT(ugm.user_id)           AS member_count,
              COALESCE(SUM(l.total_points), 0)  AS total_points,
              COALESCE(SUM(l.exact_results), 0) AS exact_results,
              CASE WHEN COUNT(ugm.user_id) > 0
                   THEN ROUND(CAST(COALESCE(SUM(l.total_points), 0) AS REAL) / COUNT(ugm.user_id), 1)
                   ELSE 0 END              AS avg_points
       FROM user_groups ug
       LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
       LEFT JOIN leaderboard l ON l.user_id = ugm.user_id
       GROUP BY ug.id
       ORDER BY total_points DESC, exact_results DESC, ug.name ASC`,
    )
    return NextResponse.json({ success: true, data: { standings, currentUserId: userId } })
  }

  // --- Einzelwertung gefiltert nach Gruppe ---
  if (groupId) {
    const entries = await queryAll<LeaderboardEntry>(
      db,
      `SELECT l.*
       FROM leaderboard l
       INNER JOIN user_group_members ugm ON ugm.user_id = l.user_id
       WHERE ugm.group_id = ?
       ORDER BY l.total_points DESC, l.exact_results DESC, l.username ASC`,
      [groupId],
    )
    return NextResponse.json({ success: true, data: { entries, currentUserId: userId } })
  }

  // --- Gesamtrangliste (Einzelwertung) ---
  const entries = await queryAll<LeaderboardEntry>(
    db,
    `SELECT * FROM leaderboard ORDER BY total_points DESC, exact_results DESC, username ASC`,
  )
  return NextResponse.json({ success: true, data: { entries, currentUserId: userId } })
}
