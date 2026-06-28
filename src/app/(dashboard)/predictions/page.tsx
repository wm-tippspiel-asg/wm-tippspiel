import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll } from '@/lib/db'
import { PredictionsClient } from '@/components/dashboard/PredictionsClient'
import { getRoundLabel } from '@/lib/utils'
import type { Match, Prediction, MatchRound } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Meine Tipps' }

export default async function PredictionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  const [matches, personalPredictions] = await Promise.all([
    queryAll<Match>(db, 'SELECT * FROM matches ORDER BY match_time ASC'),
    queryAll<Prediction>(db, 'SELECT * FROM predictions WHERE user_id = ?', [user.id]),
  ])

  const rounds: MatchRound[] = ['group', 'round_of_16', 'round_of_8', 'quarter_final', 'semi_final', 'third_place', 'final']
  const grouped: { round: MatchRound; label: string; matches: Match[] }[] = rounds
    .map((round) => ({ round, label: getRoundLabel(round), matches: matches.filter((m) => m.round === round) }))
    .filter((g) => g.matches.length > 0)

  return (
    <PredictionsClient
      grouped={grouped}
      personalPredictions={personalPredictions}
    />
  )
}
