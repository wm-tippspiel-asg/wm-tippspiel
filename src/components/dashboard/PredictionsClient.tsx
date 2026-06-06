'use client'

import { useState, useMemo } from 'react'
import { Target, User, Users } from 'lucide-react'
import { MatchCard } from '@/components/dashboard/MatchCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import type { Match, Prediction, MatchRound, UserGroup } from '@/types'

interface RoundGroup {
  round: MatchRound
  label: string
  matches: Match[]
}

interface Props {
  grouped: RoundGroup[]
  personalPredictions: Prediction[]
  myGroups: UserGroup[]
  groupPredictions: Record<string, Prediction[]>  // group_id → predictions
}

export function PredictionsClient({ grouped, personalPredictions, myGroups, groupPredictions }: Props) {
  // 'personal' or group id
  const [activeTab, setActiveTab] = useState<'personal' | string>('personal')

  const isPersonal = activeTab === 'personal'
  const activeGroup = isPersonal ? null : myGroups.find((g) => g.id === activeTab) ?? null

  const predMap = useMemo(
    () => isPersonal
      ? new Map(personalPredictions.map((p) => [p.match_id, p]))
      : new Map((groupPredictions[activeTab] ?? []).map((p) => [p.match_id, p])),
    [isPersonal, activeTab, personalPredictions, groupPredictions],
  )

  const { tipped, total, totalPoints } = useMemo(() => {
    const allMatches = grouped.flatMap((g) => g.matches).filter((m) => m.status !== 'cancelled')
    const preds = isPersonal ? personalPredictions : (groupPredictions[activeTab] ?? [])
    return {
      tipped: predMap.size,
      total: allMatches.length,
      totalPoints: preds.reduce((s, p) => s + (p.points ?? 0), 0),
    }
  }, [grouped, isPersonal, activeTab, predMap, personalPredictions, groupPredictions])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Meine Tipps</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tipped} von {total} Spielen getippt · {totalPoints} Punkte
          {activeGroup ? ` (${activeGroup.name})` : ''}
        </p>
      </div>

      {/* Tabs: Persönlich | Gruppe A | Gruppe B */}
      {myGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isPersonal
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Persönlich
          </button>
          {myGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveTab(g.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === g.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Hinweis bei Gruppen-Tab */}
      {activeGroup && (
        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300">
          <strong>{activeGroup.name}:</strong> Diese Tipps zählen nur für die Gruppenwertung — unabhängig von deinen persönlichen Tipps.
        </div>
      )}

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
                    key={`${activeTab}-${match.id}`}
                    match={match}
                    prediction={predMap.get(match.id)}
                    groupId={isPersonal ? undefined : activeTab}
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
