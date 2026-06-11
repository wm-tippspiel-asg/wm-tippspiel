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

    // Faire Klassenwertung: gewertet wird der Durchschnitt pro Mitglied
    // (Ø Punkte/Mitglied), damit größere Klassen keinen Vorteil durch ihre
    // Mitgliederzahl haben. Nur aktive, nicht gesperrte Schüler:innen zählen —
    // konsistent mit der Einzelrangliste. Sortierung & Tiebreak laufen über die
    // ungerundeten Durchschnitte; avg_points wird nur fürs Anzeigen gerundet.
    // Nur Mitglieder mit ≥1 Tipp zählen im Nenner — wer nie getippt hat,
    // darf den Gruppenscnitt nicht runterziehen.
    const standings = await queryAll<GroupStanding>(
      db,
      `WITH group_stats AS (
         SELECT ug.id, ug.name, ug.description,
                COUNT(DISTINCT u.id) AS member_count,
                COALESCE(SUM(CASE WHEN COALESCE(l.total_tips,0)>0 THEN l.total_points ELSE 0 END), 0) AS total_points,
                COALESCE(SUM(CASE WHEN COALESCE(l.total_tips,0)>0 THEN l.exact_results ELSE 0 END), 0) AS exact_results,
                COUNT(CASE WHEN COALESCE(l.total_tips,0)>0 THEN 1 END) AS active_members,
                CASE WHEN COUNT(CASE WHEN COALESCE(l.total_tips,0)>0 THEN 1 END) > 0
                     THEN CAST(COALESCE(SUM(CASE WHEN COALESCE(l.total_tips,0)>0 THEN l.total_points ELSE 0 END),0) AS REAL)
                          / COUNT(CASE WHEN COALESCE(l.total_tips,0)>0 THEN 1 END)
                     ELSE 0 END AS avg_points_raw,
                CASE WHEN COUNT(CASE WHEN COALESCE(l.total_tips,0)>0 THEN 1 END) > 0
                     THEN CAST(COALESCE(SUM(CASE WHEN COALESCE(l.total_tips,0)>0 THEN l.exact_results ELSE 0 END),0) AS REAL)
                          / COUNT(CASE WHEN COALESCE(l.total_tips,0)>0 THEN 1 END)
                     ELSE 0 END AS avg_exact_raw,
                CASE WHEN COUNT(CASE WHEN COALESCE(l.total_tips,0)>0 THEN 1 END) > 0
                     THEN ROUND(
                       CAST(COALESCE(SUM(CASE WHEN COALESCE(l.total_tips,0)>0 THEN l.total_points ELSE 0 END),0) AS REAL)
                       / COUNT(CASE WHEN COALESCE(l.total_tips,0)>0 THEN 1 END), 1)
                     ELSE 0 END AS avg_points
         FROM user_groups ug
         LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
         LEFT JOIN users u ON u.id = ugm.user_id AND u.role = 'user' AND u.is_banned = 0
         LEFT JOIN leaderboard l ON l.user_id = u.id
         GROUP BY ug.id
       )
       SELECT id, name, description, member_count, total_points, exact_results, avg_points, avg_points_raw, avg_exact_raw
       FROM group_stats
       ORDER BY avg_points_raw DESC, avg_exact_raw DESC, name ASC`,
    )
    
    // Return only the fields needed by frontend
    const result = standings.map(({ id, name, description, member_count, total_points, exact_results, avg_points }) => ({
      id, name, description, member_count, total_points, exact_results, avg_points
    }))
    await setCached(CACHE_KEYS.LEADERBOARD_GROUPS, result)
    return NextResponse.json({ success: true, data: { standings: result, currentUserId: userId } })
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
