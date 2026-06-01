import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll } from '@/lib/db'
import { MatchCard } from '@/components/dashboard/MatchCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { getRoundLabel } from '@/lib/utils'
import { Target } from 'lucide-react'
import type { Match, Prediction, MatchRound } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Meine Tipps' }

export default async function PredictionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  const matches = await queryAll<Match>(
    db,
    'SELECT * FROM matches ORDER BY match_time ASC',
  )

  const predictions = await queryAll<Prediction>(
    db,
    'SELECT * FROM predictions WHERE user_id = ?',
    [user.id],
  )

  const predMap = new Map(predictions.map((p) => [p.match_id, p]))

  // Group by round
  const rounds = [
    'group', 'round_of_16', 'round_of_8', 'quarter_final', 'semi_final', 'final',
  ] as MatchRound[]

  const grouped = new Map<MatchRound, Match[]>()
  for (const round of rounds) {
    const roundMatches = matches.filter((m) => m.round === round)
    if (roundMatches.length > 0) grouped.set(round, roundMatches)
  }

  const tipped = predictions.length
  const total = matches.filter((m) => m.status !== 'cancelled').length
  const totalPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Meine Tipps</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {tipped} von {total} Spielen getippt · {totalPoints} Punkte gesamt
          </p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="Noch keine Spiele"
            description="Die Spiele werden bald eingetragen."
          />
        </div>
      ) : (
        <div className="space-y-8">
          {rounds.map((round) => {
            const roundMatches = grouped.get(round)
            if (!roundMatches) return null

            return (
              <section key={round}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="section-title">{getRoundLabel(round)}</h2>
                  <Badge variant="slate">
                    {roundMatches.filter((m) => predMap.has(m.id)).length}/{roundMatches.length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predMap.get(match.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
