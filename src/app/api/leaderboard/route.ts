import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll } from '@/lib/db'
import { getCached, setCached, CACHE_KEYS } from '@/lib/cache'
import type { LeaderboardEntry, GroupStanding } from '@/types'

export const runtime = 'edge'

// Alle aktiven User mit ihren Leaderboard-Daten — auch User mit 0 Punkten erscheinen
const ALL_USERS_SQL = `
  SELECT u.id AS user_id, u.username,
         COALESCE(l.total_points,   0) AS total_points,
         COALESCE(l.exact_results,  0) AS exact_results,
         COALESCE(l.correct_diff,   0) AS correct_diff,
         COALESCE(l.correct_winner, 0) AS correct_winner,
         COALESCE(l.total_tips,     0) AS total_tips,
         l.rank
  FROM users u
  LEFT JOIN leaderboard l ON l.user_id = u.id
  WHERE u.role = 'user' AND u.is_banned = 0
  ORDER BY total_points DESC, exact_results DESC, u.username ASC`

const GROUP_USERS_SQL = `
  SELECT u.id AS user_id, u.username,
         COALESCE(l.total_points,   0) AS total_points,
         COALESCE(l.exact_results,  0) AS exact_results,
         COALESCE(l.correct_diff,   0) AS correct_diff,
         COALESCE(l.correct_winner, 0) AS correct_winner,
         COALESCE(l.total_tips,     0) AS total_tips,
         l.rank
  FROM users u
  INNER JOIN user_group_members ugm ON ugm.user_id = u.id AND ugm.group_id = ?
  LEFT JOIN leaderboard l ON l.user_id = u.id
  WHERE u.role = 'user' AND u.is_banned = 0
  ORDER BY total_points DESC, exact_results DESC, u.username ASC`

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view')
  const groupId = searchParams.get('group_id')
  const db = getDb()

  // --- Gruppenwertung ---
  if (view === 'groups') {
    const cached = await getCached<GroupStanding[]>(CACHE_KEYS.LEADERBOARD_GROUPS)
    if (cached) return NextResponse.json({ success: true, data: { standings: cached, currentUserId: userId } })

    const standings = await queryAll<GroupStanding>(
      db,
      `SELECT ug.id, ug.name, ug.description,
              COUNT(DISTINCT ugm.user_id) AS member_count,
              COALESCE(SUM(l.total_points), 0) AS total_points,
              COALESCE(SUM(l.exact_results), 0) AS exact_results,
              CASE WHEN COUNT(DISTINCT ugm.user_id) > 0
                   THEN ROUND(CAST(COALESCE(SUM(l.total_points), 0) AS REAL) / COUNT(DISTINCT ugm.user_id), 1)
                   ELSE 0 END AS avg_points
       FROM user_groups ug
       LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
       LEFT JOIN leaderboard l ON l.user_id = ugm.user_id
       GROUP BY ug.id
       ORDER BY total_points DESC, exact_results DESC, ug.name ASC`,
    )
    await setCached(CACHE_KEYS.LEADERBOARD_GROUPS, standings)
    return NextResponse.json({ success: true, data: { standings, currentUserId: userId } })
  }

  // --- Einzelwertung gefiltert nach Gruppe (kein Cache — gruppenspezifisch) ---
  if (groupId) {
    const entries = await queryAll<LeaderboardEntry>(db, GROUP_USERS_SQL, [groupId])
    return NextResponse.json({ success: true, data: { entries, currentUserId: userId } })
  }

  // --- Gesamtrangliste ---
  const cached = await getCached<LeaderboardEntry[]>(CACHE_KEYS.LEADERBOARD_ALL)
  if (cached) return NextResponse.json({ success: true, data: { entries: cached, currentUserId: userId } })

  const entries = await queryAll<LeaderboardEntry>(db, ALL_USERS_SQL)
  await setCached(CACHE_KEYS.LEADERBOARD_ALL, entries)
  return NextResponse.json({ success: true, data: { entries, currentUserId: userId } })
}
