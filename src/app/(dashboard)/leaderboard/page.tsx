import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne } from '@/lib/db'
import { LeaderboardClient } from '@/components/dashboard/LeaderboardClient'
import type { LeaderboardEntry, UserGroup } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Rangliste' }

export default async function LeaderboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  const [entries, myEntry, groups] = await Promise.all([
    queryAll<LeaderboardEntry>(
      db,
      'SELECT * FROM leaderboard ORDER BY total_points DESC, exact_results DESC, username ASC',
    ),
    queryOne<LeaderboardEntry>(
      db,
      'SELECT * FROM leaderboard WHERE user_id = ?',
      [user.id],
    ),
    queryAll<UserGroup & { member_count: number }>(
      db,
      `SELECT ug.id, ug.name, ug.description, ug.created_by, ug.created_at,
              COUNT(ugm.user_id) AS member_count
       FROM user_groups ug
       LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
       GROUP BY ug.id
       ORDER BY ug.name ASC`,
    ),
  ])

  return (
    <LeaderboardClient
      initialEntries={entries}
      myEntry={myEntry ?? null}
      currentUserId={user.id}
      groups={groups}
    />
  )
}
