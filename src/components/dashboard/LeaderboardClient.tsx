'use client'

import { useState, useEffect, useMemo } from 'react'
import { Trophy, Medal, Target, Users, ArrowLeft, ChevronRight } from 'lucide-react'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { StatsCard } from '@/components/dashboard/StatsCard'
import type { LeaderboardEntry, GroupStanding } from '@/types'

interface Props {
  initialEntries: LeaderboardEntry[]
  myEntry: LeaderboardEntry | null
  currentUserId: string
  groups: unknown[]  // no longer used in UI, kept for compat
  initialGroupStandings: GroupStanding[]
}

const MEDALS = ['🥇', '🥈', '🥉']

export function LeaderboardClient({ initialEntries, myEntry, currentUserId, initialGroupStandings }: Props) {
  const [mainTab, setMainTab]         = useState<'einzel' | 'gruppen'>('einzel')
  const [drillGroupId, setDrillGroupId] = useState<string | null>(null)
  const [drillEntries, setDrillEntries] = useState<LeaderboardEntry[]>([])
  const [drillLoading, setDrillLoading] = useState(false)
  const [groupStandings, setGroupStandings] = useState(initialGroupStandings)

  // Refresh group standings in background
  useEffect(() => {
    fetch('/api/leaderboard?view=groups')
      .then((r) => r.json() as Promise<{ success: boolean; data: { standings: GroupStanding[] } }>)
      .then((d) => { if (d.success) setGroupStandings(d.data.standings) })
      .catch(() => {})
  }, [])

  // Load group drill-down
  useEffect(() => {
    if (!drillGroupId) { setDrillEntries([]); return }
    setDrillLoading(true)
    fetch(`/api/leaderboard?group_id=${drillGroupId}`)
      .then((r) => r.json() as Promise<{ success: boolean; data: { entries: LeaderboardEntry[] } }>)
      .then((d) => {
        if (d.success) setDrillEntries(d.data.entries.map((e, i) => ({ ...e, rank: i + 1 })))
      })
      .catch(() => {})
      .finally(() => setDrillLoading(false))
  }, [drillGroupId])

  const rankedEntries = useMemo(
    () => initialEntries.map((e, i) => ({ ...e, rank: i + 1 })),
    [initialEntries],
  )

  const myCurrentEntry = useMemo(
    () => myEntry ? (rankedEntries.find((e) => e.user_id === currentUserId) ?? myEntry) : null,
    [rankedEntries, myEntry, currentUserId],
  )

  const drillGroup = useMemo(
    () => groupStandings.find((g) => g.id === drillGroupId),
    [groupStandings, drillGroupId],
  )

  function switchTab(tab: 'einzel' | 'gruppen') {
    setMainTab(tab)
    setDrillGroupId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Title ── */}
      <div>
        <h1 className="page-title">Rangliste</h1>
        <p style={{ marginTop: 4, fontSize: 14, color: 'var(--muted)' }}>
          {mainTab === 'einzel'
            ? `${rankedEntries.length} Teilnehmer`
            : drillGroupId
              ? `${drillGroup?.name ?? ''} · ${drillGroup?.member_count ?? 0} Mitglieder`
              : `${groupStandings.length} Klassen`}
        </p>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: '#353a37' }}>
        {(['einzel', 'gruppen'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium lb-tab-btn ${mainTab === tab ? 'lb-tab-btn--active' : ''}`}
          >
            {tab === 'einzel' ? 'Einzelwertung' : 'Klassenwertung'}
          </button>
        ))}
      </div>

      {/* ── EINZELWERTUNG ── */}
      <div className={`lb-panel${mainTab === 'einzel' ? ' lb-panel--active' : ''}`}>
        {myCurrentEntry && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatsCard label="Mein Rang" value={myCurrentEntry.rank ? `#${myCurrentEntry.rank}` : '–'} icon={Trophy} highlight />
            <StatsCard label="Punkte" value={myCurrentEntry.total_points} icon={Medal} />
            <StatsCard label="Exakte Treffer" value={myCurrentEntry.exact_results} icon={Target} description="+5 Pkt." />
            <StatsCard label="Tipps gesamt" value={myCurrentEntry.total_tips} icon={Target} />
          </div>
        )}

        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 className="section-title">Gesamtrangliste</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Exakt=5 Pkt. · Differenz=3 Pkt. · Gewinner=2 Pkt.
            </p>
          </div>
          <LeaderboardTable entries={rankedEntries} currentUserId={currentUserId} />
        </div>
      </div>

      {/* ── KLASSENWERTUNG ── */}
      <div className={`lb-panel${mainTab === 'gruppen' ? ' lb-panel--active' : ''}`}>

        {drillGroupId ? (
          /* ─ Drill-down: Einzelrangliste einer Klasse ─ */
          <>
            <button
              onClick={() => setDrillGroupId(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                border: 0, background: 'transparent', color: 'var(--muted)',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: '4px 0',
                transition: 'color .12s',
              }}
              className="lb-back-btn"
            >
              <ArrowLeft size={15} />
              Zurück zu Klassen
            </button>

            <div className="card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h2 className="section-title">{drillGroup?.name}</h2>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {drillGroup?.member_count} Mitglieder · Ø {drillGroup?.avg_points} Pkt.
                </p>
              </div>
              {drillLoading
                ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <div className="h-6 w-6 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                  </div>
                )
                : <LeaderboardTable entries={drillEntries} currentUserId={currentUserId} />}
            </div>
          </>
        ) : (
          /* ─ Klassenliste ─ */
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} style={{ color: 'var(--accent)' }} />
                <h2 className="section-title">Klassenwertung</h2>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                Summe aller Punkte · Klasse anklicken für Einzelrangliste
              </p>
            </div>
            <div>
              {groupStandings.length === 0 ? (
                <p style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 15 }}>
                  Noch keine Klassen angelegt.
                </p>
              ) : groupStandings.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => setDrillGroupId(g.id)}
                  className="lb-group-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px', width: '100%',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    border: i > 0 ? undefined : 'none',
                    borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                    background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, flexShrink: 0 }}>
                    {i < 3
                      ? <span style={{ fontSize: 20 }}>{MEDALS[i]}</span>
                      : <span style={{ fontSize: 14, color: 'var(--muted)' }}>{i + 1}</span>}
                  </div>

                  <span style={{
                    width: 9, height: 9, borderRadius: 99, flexShrink: 0,
                    background: i === 0 ? 'var(--gold)' : i === 1 ? 'var(--silver)' : i === 2 ? 'var(--bronze)' : 'var(--surface-3)',
                  }} />

                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{g.name}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}>
                      {g.member_count} Mitglied{g.member_count !== 1 ? 'er' : ''}
                    </span>
                  </div>

                  <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginRight: 6, flexShrink: 0 }}>
                    Ø {g.avg_points} Pkt.
                  </span>

                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
                    width: 54, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                    color: i === 0 ? 'var(--good)' : 'var(--ink)',
                  }}>
                    {g.total_points}
                  </span>

                  <ChevronRight size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
