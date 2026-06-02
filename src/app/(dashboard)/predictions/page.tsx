import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll } from '@/lib/db'
import { PredictionsClient } from '@/components/dashboard/PredictionsClient'
import { getRoundLabel } from '@/lib/utils'
import type { Match, Prediction, MatchRound, UserGroup } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Meine Tipps' }

export default async function PredictionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  const [matches, personalPredictions, myGroups] = await Promise.all([
    queryAll<Match>(db, 'SELECT * FROM matches ORDER BY match_time ASC'),
    queryAll<Prediction>(db, 'SELECT * FROM predictions WHERE user_id = ?', [user.id]),
    queryAll<UserGroup>(
      db,
      `SELECT ug.id, ug.name, ug.description, ug.created_by, ug.created_at
       FROM user_groups ug
       INNER JOIN user_group_members ugm ON ugm.group_id = ug.id
       WHERE ugm.user_id = ?
       ORDER BY ug.name ASC`,
      [user.id],
    ),
  ])

  // Load group predictions for each group the user is in
  const groupPredictions: Record<string, Prediction[]> = {}
  for (const group of myGroups) {
    const preds = await queryAll<Prediction & { group_id: string }>(
      db,
      'SELECT * FROM group_predictions WHERE user_id = ? AND group_id = ?',
      [user.id, group.id],
    )
    groupPredictions[group.id] = preds
  }

  const rounds: MatchRound[] = ['group', 'round_of_16', 'round_of_8', 'quarter_final', 'semi_final', 'final']
  const grouped: { round: MatchRound; label: string; matches: Match[] }[] = rounds
    .map((round) => ({ round, label: getRoundLabel(round), matches: matches.filter((m) => m.round === round) }))
    .filter((g) => g.matches.length > 0)

  return (
    <PredictionsClient
      grouped={grouped}
      personalPredictions={personalPredictions}
      myGroups={myGroups}
      groupPredictions={groupPredictions}
    />
  )
}
