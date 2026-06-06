'use client'

import { useMemo } from 'react'
import { Target } from 'lucide-react'
import { MatchCard } from '@/components/dashboard/MatchCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import type { Match, Prediction, MatchRound } from '@/types'

interface RoundGroup {
  round: MatchRound
  label: string
  matches: Match[]
}

interface Props {
  grouped: RoundGroup[]
  personalPredictions: Prediction[]
}

export function PredictionsClient({ grouped, personalPredictions }: Props) {
  const predMap = useMemo(
    () => new Map(personalPredictions.map((p) => [p.match_id, p])),
    [personalPredictions],
  )

  const { tipped, total, totalPoints } = useMemo(() => {
    const allMatches = grouped.flatMap((g) => g.matches).filter((m) => m.status !== 'cancelled')
    return {
      tipped: predMap.size,
      total: allMatches.length,
      totalPoints: personalPredictions.reduce((s, p) => s + (p.points ?? 0), 0),
    }
  }, [grouped, predMap, personalPredictions])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Meine Tipps</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tipped} von {total} Spielen getippt · {totalPoints} Punkte
        </p>
      </div>

      {/* Match-Liste */}
      {grouped.length === 0 ? (
        <div className="card">
          <EmptyState icon={Target} title="Noch keine Spiele" description="Die Spiele werden bald eingetragen." />
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ round, label, matches }) => (
            <section key={round}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="section-title">{label}</h2>
                <Badge variant="slate">
                  {matches.filter((m) => predMap.has(m.id)).length}/{matches.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predMap.get(match.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
