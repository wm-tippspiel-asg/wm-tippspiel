import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne } from '@/lib/db'
import { LeaderboardClient } from '@/components/dashboard/LeaderboardClient'
import type { LeaderboardEntry, UserGroup, GroupStanding } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Rangliste' }

export default async function LeaderboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  const [entries, myEntry, groups, groupStandings] = await Promise.all([
    queryAll<LeaderboardEntry>(
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
       WHERE u.role = 'user' AND u.is_banned = 0
       ORDER BY total_points DESC, exact_results DESC, u.username ASC`,
    ),
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
    queryAll<GroupStanding>(
      db,
      `SELECT ug.id, ug.name, ug.description,
              COUNT(DISTINCT ugm.user_id)              AS member_count,
              COALESCE(SUM(gp.points), 0)              AS total_points,
              COALESCE(SUM(CASE WHEN gp.points IS NOT NULL AND gp.points > 0 THEN 1 ELSE 0 END), 0) AS exact_results,
              CASE WHEN COUNT(DISTINCT ugm.user_id) > 0
                   THEN ROUND(CAST(COALESCE(SUM(gp.points), 0) AS REAL) / COUNT(DISTINCT ugm.user_id), 1)
                   ELSE 0 END                          AS avg_points
       FROM user_groups ug
       LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
       LEFT JOIN group_predictions gp ON gp.user_id = ugm.user_id AND gp.group_id = ug.id
       GROUP BY ug.id
       ORDER BY total_points DESC, exact_results DESC, ug.name ASC`,
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
