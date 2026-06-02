'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Target } from 'lucide-react'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { StatsCard } from '@/components/dashboard/StatsCard'
import type { LeaderboardEntry, UserGroup } from '@/types'

interface Props {
  initialEntries: LeaderboardEntry[]
  myEntry: LeaderboardEntry | null
  currentUserId: string
  groups: (UserGroup & { member_count: number })[]
}

export function LeaderboardClient({ initialEntries, myEntry, currentUserId, groups }: Props) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [entries, setEntries] = useState(initialEntries)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeGroupId === null) {
      setEntries(initialEntries)
      return
    }
    setLoading(true)
    fetch(`/api/leaderboard?group_id=${activeGroupId}`)
      .then((r) => r.json() as Promise<{ success: boolean; data: { entries: LeaderboardEntry[] } }>)
      .then((d) => { if (d.success) setEntries(d.data.entries) })
      .finally(() => setLoading(false))
  }, [activeGroupId, initialEntries])

  const activeGroup = groups.find((g) => g.id === activeGroupId)
  const totalCount = activeGroupId ? entries.length : initialEntries.length

  // Re-rank filtered entries (rank column in leaderboard is global)
  const rankedEntries = entries.map((e, i) => ({ ...e, rank: i + 1 }))

  // My entry in current view
  const myCurrentEntry = myEntry
    ? rankedEntries.find((e) => e.user_id === currentUserId) ?? myEntry
    : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Rangliste</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {totalCount} Teilnehmer{activeGroup ? ` in ${activeGroup.name}` : ''}
        </p>
      </div>

      {/* My stats */}
      {myCurrentEntry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCard label="Mein Rang" value={myCurrentEntry.rank ? `#${myCurrentEntry.rank}` : '–'} icon={Trophy} highlight />
          <StatsCard label="Punkte" value={myCurrentEntry.total_points} icon={Medal} />
          <StatsCard label="Exakte Treffer" value={myCurrentEntry.exact_results} icon={Target} description="+5 Pkt." />
          <StatsCard label="Tipps gesamt" value={myCurrentEntry.total_tips} icon={Target} />
        </div>
      )}

      {/* Group filter tabs */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGroupId(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeGroupId === null
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Gesamt
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroupId(g.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeGroupId === g.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="section-title">
            {activeGroup ? `${activeGroup.name}` : 'Gesamtrangliste'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Exakt=5 Pkt. · Differenz=3 Pkt. · Gewinner=2 Pkt.
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <LeaderboardTable entries={rankedEntries} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  )
}
