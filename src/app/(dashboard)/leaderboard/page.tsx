import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne } from '@/lib/db'
import { getCached, setCached, CACHE_KEYS } from '@/lib/cache'
import { LeaderboardClient } from '@/components/dashboard/LeaderboardClient'
import type { LeaderboardEntry, UserGroup, GroupStanding } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Rangliste' }

export default async function LeaderboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  const LEADERBOARD_SQL = `
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

  const GROUP_STANDINGS_SQL = `
    SELECT ug.id, ug.name, ug.description,
           COUNT(DISTINCT ugm.user_id)              AS member_count,
           COALESCE(SUM(gp.points), 0)              AS total_points,
           COALESCE(SUM(CASE WHEN gp.points IS NOT NULL AND gp.points > 0 THEN 1 ELSE 0 END), 0) AS exact_results,
           CASE WHEN COUNT(DISTINCT ugm.user_id) > 0
                THEN ROUND(CAST(COALESCE(SUM(gp.points), 0) AS REAL) / COUNT(DISTINCT ugm.user_id), 1)
                ELSE 0 END AS avg_points
    FROM user_groups ug
    LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
    LEFT JOIN group_predictions gp ON gp.user_id = ugm.user_id AND gp.group_id = ug.id
    GROUP BY ug.id
    ORDER BY total_points DESC, exact_results DESC, ug.name ASC`

  // Cached queries (global data, same for all users)
  let entries = await getCached<LeaderboardEntry[]>(CACHE_KEYS.LEADERBOARD_ALL)
  if (!entries) {
    entries = await queryAll<LeaderboardEntry>(db, LEADERBOARD_SQL)
    await setCached(CACHE_KEYS.LEADERBOARD_ALL, entries)
  }

  let groupStandings = await getCached<GroupStanding[]>(CACHE_KEYS.LEADERBOARD_GROUPS)
  if (!groupStandings) {
    groupStandings = await queryAll<GroupStanding>(db, GROUP_STANDINGS_SQL)
    await setCached(CACHE_KEYS.LEADERBOARD_GROUPS, groupStandings)
  }

  // User-specific queries (not cached)
  const [myEntry, groups] = await Promise.all([
    queryOne<LeaderboardEntry>(
      db,
      `SELECT u.id AS user_id, u.username,
              COALESCE(l.total_points,   0) AS total_points,
              COALESCE(l.exact_results,  0) AS exact_results,
              COALESCE(l.correct_diff,   0) AS correct_diff,
              COALESCE(l.correct_winner, 0) AS correct_winner,
              COALESCE(l.total_tips,     0) AS total_tips,
              l.rank
       FROM users u
       LEFT JOIN leaderboard l ON l.user_id = u.id
       WHERE u.id = ?`,
      [user.id],
    ),
    queryAll<UserGroup>(
      db,
      'SELECT id, name, description, created_by, created_at FROM user_groups ORDER BY name ASC',
    ),
  ])

  return (
    <LeaderboardClient
      initialEntries={entries}
      myEntry={myEntry ?? null}
      currentUserId={user.id}
      groups={groups}
      initialGroupStandings={groupStandings}
    />
  )
}
