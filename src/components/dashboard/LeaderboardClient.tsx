'use client'

import { useState, useEffect, useMemo } from 'react'
import { Trophy, Medal, Target, Users, ArrowLeft, ChevronRight } from 'lucide-react'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { StatsCard } from '@/components/dashboard/StatsCard'
import type { LeaderboardEntry, GroupStanding, Match, Prediction } from '@/types'

type PredRow = { user_id: string; match_id: string; home_score: number; away_score: number; points: number | null }

function abbr(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '') + (words[2]?.[0] ?? '')).toUpperCase()
  return name.slice(0, 3).toUpperCase()
}

interface Props {
  initialEntries: LeaderboardEntry[]
  myEntry: LeaderboardEntry | null
  currentUserId: string
  groups: unknown[]
  initialGroupStandings: GroupStanding[]
  visibleMatches: Match[]
  allPredictions: PredRow[]
}

const MEDALS = ['🥇', '🥈', '🥉']

export function LeaderboardClient({ initialEntries, myEntry, currentUserId, initialGroupStandings, visibleMatches, allPredictions }: Props) {
  const [mainTab, setMainTab] = useState<'einzel' | 'gruppen'>('einzel')
  const [drillGroupId, setDrillGroupId] = useState<string | null>(null)
  const [drillEntries, setDrillEntries] = useState<LeaderboardEntry[]>([])
  const [drillLoading, setDrillLoading] = useState(false)
  const [groupStandings, setGroupStandings] = useState(initialGroupStandings)
  const [liveMatch, setLiveMatch] = useState<Match | null>(null)
  const [predictions, setPredictions] = useState<Map<string, Prediction>>(new Map())

  useEffect(() => {
    async function refreshGroupStandings() {
      try {
        const res = await fetch('/api/leaderboard?view=groups')
        const d = await res.json() as { success: boolean; data?: { standings: GroupStanding[] } }
        if (d.success && d.data) setGroupStandings(d.data.standings)
      } catch { /* silent */ }
    }
    refreshGroupStandings()
    const id = setInterval(refreshGroupStandings, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    async function loadLiveMatch() {
      try {
        const res = await fetch('/api/leaderboard-live')
        const d = await res.json() as { success: boolean; data?: { liveMatch: Match | null; predictions: Prediction[] } }
        if (d.success && d.data) {
          setLiveMatch(d.data.liveMatch)
          setPredictions(new Map(d.data.predictions.map(p => [p.user_id, p])))
        }
      } catch {
        setLiveMatch(null)
        setPredictions(new Map())
      }
    }
    loadLiveMatch()
    const id = setInterval(loadLiveMatch, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!drillGroupId) { setDrillEntries([]); return }
    setDrillLoading(true)
    fetch(`/api/leaderboard?group_id=${drillGroupId}`)
      .then((r) => r.json() as Promise<{ success: boolean; data: { entries: LeaderboardEntry[] } }>)
      .then((d) => { if (d.success) setDrillEntries(d.data.entries.map((e, i) => ({ ...e, rank: i + 1 }))) })
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

  // userId:matchId → prediction
  const predMap = useMemo(() => {
    const m = new Map<string, PredRow>()
    allPredictions.forEach(p => m.set(`${p.user_id}:${p.match_id}`, p))
    return m
  }, [allPredictions])

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
      <div className="lb-tab-group flex gap-1 p-1 rounded-lg w-fit">
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

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 className="section-title">Gesamtrangliste</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Exakt=5 Pkt. · Differenz=3 Pkt. · Gewinner=2 Pkt.
            </p>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--surface)', padding: '8px 4px 8px 16px', width: 36, textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>#</th>
                  <th style={{ position: 'sticky', left: 36, zIndex: 2, background: 'var(--surface)', padding: '8px 8px 8px 4px', fontSize: 11, color: 'var(--muted)', fontWeight: 600, textAlign: 'left', minWidth: 110 }}>Name</th>
                  <th style={{ padding: '8px 14px 8px 8px', fontSize: 11, color: 'var(--muted)', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>Pkt</th>
                  {visibleMatches.map(m => (
                    <th key={m.id} style={{ padding: '4px 2px', textAlign: 'center', width: 56, minWidth: 56, verticalAlign: 'bottom' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, letterSpacing: '.03em', lineHeight: 1.3 }}>{abbr(m.home_team)}</span>
                        <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, letterSpacing: '.03em', lineHeight: 1.3 }}>{abbr(m.away_team)}</span>
                        {m.home_score !== null && (
                          <span style={{ fontSize: 9, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', marginTop: 2, lineHeight: 1 }}>
                            {m.home_score}:{m.away_score}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankedEntries.map((entry, i) => {
                  const isMe = entry.user_id === currentUserId
                  const rank = entry.rank ?? i + 1
                  const bg = isMe ? 'var(--accent-soft)' : 'var(--surface)'
                  return (
                    <tr key={entry.user_id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 1, background: bg, padding: '10px 4px 10px 16px', textAlign: 'center', width: 36 }}>
                        {rank <= 3
                          ? <span style={{ fontSize: 16 }}>{MEDALS[rank - 1]}</span>
                          : <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{rank}</span>}
                      </td>
                      <td style={{ position: 'sticky', left: 36, zIndex: 1, background: bg, padding: '10px 8px 10px 4px', fontWeight: 700, color: isMe ? 'var(--accent-strong)' : 'var(--ink)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 110 }}>
                        {entry.username}
                        {isMe && <span style={{ marginLeft: 5, fontSize: 9, background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '1px 4px', fontWeight: 700, verticalAlign: 'middle' }}>Du</span>}
                      </td>
                      <td style={{ padding: '10px 14px 10px 8px', textAlign: 'right', fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums', color: rank === 1 ? 'var(--good)' : 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {entry.total_points}
                      </td>
                      {visibleMatches.map(m => {
                        const pred = predMap.get(`${entry.user_id}:${m.id}`)
                        return (
                          <td key={m.id} style={{ padding: '10px 2px', textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: 'var(--muted)', whiteSpace: 'nowrap', width: 56, minWidth: 56 }}>
                            {pred ? `${pred.home_score}:${pred.away_score}` : '–'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── KLASSENWERTUNG ── */}
      <div className={`lb-panel${mainTab === 'gruppen' ? ' lb-panel--active' : ''}`}>
        {drillGroupId ? (
          <>
            <button
              onClick={() => setDrillGroupId(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: '4px 0', transition: 'color .12s' }}
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
                ? <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><div className="h-6 w-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div>
                : <LeaderboardTable entries={drillEntries} currentUserId={currentUserId} liveMatch={liveMatch} predictions={predictions} />}
            </div>
          </>
        ) : (
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} style={{ color: 'var(--accent)' }} />
                <h2 className="section-title">Klassenwertung</h2>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                Ø Punkte pro Mitglied · fair unabhängig von der Klassengröße · Klasse anklicken für Einzelrangliste
              </p>
            </div>
            <div>
              {groupStandings.length === 0 ? (
                <p style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 15 }}>Noch keine Klassen angelegt.</p>
              ) : groupStandings.map((g, i) => (
                <button key={g.id} onClick={() => setDrillGroupId(g.id)} className="lb-group-row"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', width: '100%', borderTop: i > 0 ? '1px solid var(--border)' : 'none', border: i > 0 ? undefined : 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, flexShrink: 0 }}>
                    {i < 3 ? <span style={{ fontSize: 20 }}>{MEDALS[i]}</span> : <span style={{ fontSize: 14, color: 'var(--muted)' }}>{i + 1}</span>}
                  </div>
                  <span style={{ width: 9, height: 9, borderRadius: 99, flexShrink: 0, background: i === 0 ? 'var(--gold)' : i === 1 ? 'var(--silver)' : i === 2 ? 'var(--bronze)' : 'var(--surface-3)' }} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{g.name}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}>{g.member_count} Mitglied{g.member_count !== 1 ? 'er' : ''} · {g.total_points} Pkt. gesamt</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0, color: i === 0 ? 'var(--good)' : 'var(--ink)' }}>Ø {g.avg_points}</span>
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
