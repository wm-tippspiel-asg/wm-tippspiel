'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Target, Users } from 'lucide-react'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { StatsCard } from '@/components/dashboard/StatsCard'
import type { LeaderboardEntry, UserGroup, GroupStanding } from '@/types'

interface Props {
  initialEntries: LeaderboardEntry[]
  myEntry: LeaderboardEntry | null
  currentUserId: string
  groups: UserGroup[]
  initialGroupStandings: GroupStanding[]
}

// ── Gruppenwertungs-Tabelle ─────────────────────────────────────────────────
function GroupStandingsTable({ standings }: { standings: GroupStanding[] }) {
  if (standings.length === 0) {
    return (
      <p style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 15 }}>
        Noch keine Gruppen angelegt.
      </p>
    )
  }
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div style={{ overflow: 'hidden' }}>
      {standings.map((g, i) => (
        <div key={g.id} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 20px',
          borderTop: i > 0 ? '1px solid var(--border)' : 'none',
        }}>
          {/* Rang */}
          <div style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {i < 3
              ? <span style={{ fontSize: 20 }}>{medals[i]}</span>
              : <span style={{ fontSize: 14, color: 'var(--muted)' }}>{i + 1}</span>}
          </div>

          {/* Farbpunkt */}
          <span style={{
            width: 9, height: 9, borderRadius: 99, flexShrink: 0,
            background: i === 0 ? 'var(--gold)' : i === 1 ? 'var(--silver)' : i === 2 ? 'var(--bronze)' : 'var(--surface-3)',
          }} />

          {/* Name + Mitglieder */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{g.name}</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}>
              {g.member_count} Mitglied{g.member_count !== 1 ? 'er' : ''}
            </span>
            {g.description && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{g.description}</div>
            )}
          </div>

          {/* Ø Punkte */}
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginRight: 12 }}
            className="md-show">
            Ø {g.avg_points} Pkt.
          </span>

          {/* Gesamtpunkte */}
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
            width: 58, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            color: i === 0 ? 'var(--good)' : 'var(--ink)',
          }}>
            {g.total_points}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export function LeaderboardClient({ initialEntries, myEntry, currentUserId, groups, initialGroupStandings }: Props) {
  // 'einzel' = Einzelwertung, 'gruppen' = Gruppenwertung
  const [mainTab, setMainTab] = useState<'einzel' | 'gruppen'>('einzel')

  // Einzelwertung: optionaler Gruppen-Filter
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [entries, setEntries] = useState(initialEntries)
  const [entriesLoading, setEntriesLoading] = useState(false)

  // Gruppenwertung
  const [groupStandings, setGroupStandings] = useState(initialGroupStandings)
  const [standingsLoading, setStandingsLoading] = useState(false)

  // Einzelwertung: neu laden wenn Gruppen-Filter wechselt
  useEffect(() => {
    if (activeGroupId === null) { setEntries(initialEntries); return }
    setEntriesLoading(true)
    fetch(`/api/leaderboard?group_id=${activeGroupId}`)
      .then((r) => r.json() as Promise<{ success: boolean; data: { entries: LeaderboardEntry[] } }>)
      .then((d) => { if (d.success) setEntries(d.data.entries) })
      .finally(() => setEntriesLoading(false))
  }, [activeGroupId, initialEntries])

  // Gruppenwertung: beim Tab-Wechsel aktualisieren
  useEffect(() => {
    if (mainTab !== 'gruppen') return
    setStandingsLoading(true)
    fetch('/api/leaderboard?view=groups')
      .then((r) => r.json() as Promise<{ success: boolean; data: { standings: GroupStanding[] } }>)
      .then((d) => { if (d.success) setGroupStandings(d.data.standings) })
      .finally(() => setStandingsLoading(false))
  }, [mainTab])

  const rankedEntries = entries.map((e, i) => ({ ...e, rank: i + 1 }))
  const myCurrentEntry = myEntry ? (rankedEntries.find((e) => e.user_id === currentUserId) ?? myEntry) : null
  const activeGroup = groups.find((g) => g.id === activeGroupId)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Rangliste</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {mainTab === 'einzel'
            ? `${entries.length} Teilnehmer${activeGroup ? ` · ${activeGroup.name}` : ''}`
            : `${groupStandings.length} Gruppe${groupStandings.length !== 1 ? 'n' : ''}`}
        </p>
      </div>

      {/* Haupt-Tabs: Einzel / Gruppen */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {(['einzel', 'gruppen'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mainTab === tab
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'einzel' ? '👤 Einzelwertung' : '👥 Gruppenwertung'}
          </button>
        ))}
      </div>

      {/* ── EINZELWERTUNG ─────────────────────────────────────── */}
      {mainTab === 'einzel' && (
        <>
          {/* Meine Stats */}
          {myCurrentEntry && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatsCard label="Mein Rang" value={myCurrentEntry.rank ? `#${myCurrentEntry.rank}` : '–'} icon={Trophy} highlight />
              <StatsCard label="Punkte" value={myCurrentEntry.total_points} icon={Medal} />
              <StatsCard label="Exakte Treffer" value={myCurrentEntry.exact_results} icon={Target} description="+5 Pkt." />
              <StatsCard label="Tipps gesamt" value={myCurrentEntry.total_tips} icon={Target} />
            </div>
          )}

          {/* Gruppen-Filter-Pills */}
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
                Alle
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

          {/* Tabelle */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="section-title">{activeGroup ? activeGroup.name : 'Gesamtrangliste'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exakt=5 Pkt. · Differenz=3 Pkt. · Gewinner=2 Pkt.
              </p>
            </div>
            {entriesLoading
              ? <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
              : <LeaderboardTable entries={rankedEntries} currentUserId={currentUserId} />}
          </div>
        </>
      )}

      {/* ── GRUPPENWERTUNG ────────────────────────────────────── */}
      {mainTab === 'gruppen' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <h2 className="section-title">Gruppenwertung</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Summe aller Punkte der Gruppenmitglieder · Ø = Durchschnitt pro Mitglied
            </p>
          </div>
          {standingsLoading
            ? <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
            : <GroupStandingsTable standings={groupStandings} />}
        </div>
      )}
    </div>
  )
}
