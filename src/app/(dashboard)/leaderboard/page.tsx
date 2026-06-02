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
      'SELECT * FROM leaderboard ORDER BY total_points DESC, exact_results DESC, username ASC',
    ),
    queryOne<LeaderboardEntry>(
      db,
      'SELECT * FROM leaderboard WHERE user_id = ?',
      [user.id],
    ),
    queryAll<UserGroup>(
      db,
      'SELECT id, name, description, created_by, created_at FROM user_groups ORDER BY name ASC',
    ),
    queryAll<GroupStanding>(
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
