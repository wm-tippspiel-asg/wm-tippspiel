'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Trophy, Medal, Target, Users, ArrowLeft, ChevronRight, X } from 'lucide-react'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { formatTime } from '@/lib/utils'
import type { LeaderboardEntry, GroupStanding, Match, Prediction } from '@/types'

type PredictionWithUser = Prediction & { username: string }

function abbr(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '') + (words[2]?.[0] ?? '')).toUpperCase()
  return name.slice(0, 3).toUpperCase()
}

function MatchChip({ match, selected, onClick }: { match: Match; selected: boolean; onClick: () => void }) {
  const isLive = match.status === 'live'
  const hasScore = match.home_score !== null
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, padding: '6px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: selected ? 'var(--accent)' : isLive ? 'var(--surface-2)' : 'var(--surface)',
        color: selected ? '#fff' : 'var(--ink)',
        minWidth: 56, transition: 'background .15s',
        outline: isLive && !selected ? '2px solid var(--accent)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 16, lineHeight: 1 }}>
        <span>{match.home_team_flag ?? '🏳'}</span>
        <span style={{ fontSize: 11, fontWeight: 700, opacity: selected ? 1 : .6, minWidth: 28, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
          {hasScore ? `${match.home_score}:${match.away_score}` : isLive ? '●' : '–:–'}
        </span>
        <span>{match.away_team_flag ?? '🏳'}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, fontSize: 9, fontWeight: 700, letterSpacing: '.02em', opacity: selected ? .9 : .55, textTransform: 'uppercase' }}>
        <span>{abbr(match.home_team)}</span>
        <span style={{ opacity: .4 }}>·</span>
        <span>{abbr(match.away_team)}</span>
      </div>
      {!hasScore && !isLive && (
        <div style={{ fontSize: 9, opacity: .5, marginTop: 1 }}>{formatTime(match.match_time)}</div>
      )}
    </button>
  )
}

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
  const [liveMatch, setLiveMatch] = useState<Match | null>(null)
  const [predictions, setPredictions] = useState<Map<string, Prediction>>(new Map())

  // Match strip
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [matchPredictions, setMatchPredictions] = useState<PredictionWithUser[]>([])
  const [predLoading, setPredLoading] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)

  // Refresh group standings in background every 30 seconds
  useEffect(() => {
    async function refreshGroupStandings() {
      try {
        const res = await fetch('/api/leaderboard?view=groups')
        const d = await res.json() as { success: boolean; data?: { standings: GroupStanding[] } }
        if (d.success && d.data) setGroupStandings(d.data.standings)
      } catch {
        // silently fail on refresh
      }
    }
    
    // Initial fetch
    refreshGroupStandings()
    
    // Poll every 30 seconds
    const id = setInterval(refreshGroupStandings, 30_000)
    return () => clearInterval(id)
  }, [])

  // Load live match and predictions
  useEffect(() => {
    async function loadLiveMatch() {
      try {
        const res = await fetch('/api/leaderboard-live')
        const d = await res.json() as { success: boolean; data?: { liveMatch: Match | null; predictions: Prediction[] } }
        if (d.success && d.data) {
          setLiveMatch(d.data.liveMatch)
          const predMap = new Map(d.data.predictions.map(p => [p.user_id, p]))
          setPredictions(predMap)
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

  // Load all matches for the strip
  useEffect(() => {
    fetch('/api/matches')
      .then((r) => r.json() as Promise<{ success: boolean; data: Match[] }>)
      .then((d) => { if (d.success) setMatches(d.data) })
      .catch(() => {})
  }, [])

  async function selectMatch(match: Match) {
    if (selectedMatch?.id === match.id) { setSelectedMatch(null); return }
    setSelectedMatch(match)
    setMatchPredictions([])
    if (match.status === 'scheduled') return
    setPredLoading(true)
    try {
      const res = await fetch(`/api/predictions?match_id=${match.id}`)
      const d = await res.json() as { success: boolean; data: PredictionWithUser[] }
      if (d.success) setMatchPredictions(d.data)
    } finally {
      setPredLoading(false)
    }
  }

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

      {/* ── Match Strip ── */}
      {matches.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div
            ref={stripRef}
            style={{
              display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
              scrollbarWidth: 'thin',
            }}
          >
            {matches.map((m) => (
              <MatchChip key={m.id} match={m} selected={selectedMatch?.id === m.id} onClick={() => selectMatch(m)} />
            ))}
          </div>

          {selectedMatch && (
            <div style={{
              background: 'var(--surface)', borderRadius: 12,
              border: '1px solid var(--border)', overflow: 'hidden',
            }}>
              {/* Panel header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {selectedMatch.home_team_flag} {selectedMatch.home_team}
                  <span style={{ color: 'var(--muted)', fontWeight: 400, margin: '0 6px' }}>vs</span>
                  {selectedMatch.away_team} {selectedMatch.away_team_flag}
                  {selectedMatch.home_score !== null && (
                    <span style={{ marginLeft: 8, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
                      {selectedMatch.home_score}:{selectedMatch.away_score}
                    </span>
                  )}
                </div>
                <button onClick={() => setSelectedMatch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Panel body */}
              {selectedMatch.status === 'scheduled' ? (
                <p style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Tipps werden nach Anpfiff sichtbar ({formatTime(selectedMatch.match_time)} Uhr)
                </p>
              ) : predLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                  <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </div>
              ) : matchPredictions.length === 0 ? (
                <p style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Noch keine Tipps abgegeben.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '7px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 11, width: 32 }}>#</th>
                        <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>Name</th>
                        <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>Tipp</th>
                        {selectedMatch.status === 'finished' && (
                          <th style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>Pkt.</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rankedEntries
                        .map((entry) => {
                          const pred = matchPredictions.find((p) => p.user_id === entry.user_id)
                          return pred ? { entry, pred } : null
                        })
                        .filter((x): x is { entry: typeof rankedEntries[0]; pred: PredictionWithUser } => x !== null)
                        .map(({ entry, pred }) => (
                          <tr key={pred.user_id} style={{
                            borderTop: '1px solid var(--border)',
                            background: pred.user_id === currentUserId ? 'var(--surface-2)' : 'transparent',
                          }}>
                            <td style={{ padding: '8px 14px', color: 'var(--muted)', fontWeight: 600, fontSize: 12 }}>
                              {entry.rank}
                            </td>
                            <td style={{ padding: '8px 8px', fontWeight: pred.user_id === currentUserId ? 700 : 500, color: 'var(--ink)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.username}
                              {pred.user_id === currentUserId && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--accent)' }}>●</span>}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono, monospace)' }}>
                              {pred.home_score}:{pred.away_score}
                            </td>
                            {selectedMatch.status === 'finished' && (
                              <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700,
                                color: pred.points && pred.points > 0 ? 'var(--good)' : 'var(--muted)' }}>
                                {pred.points ?? 0}
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 className="section-title">Gesamtrangliste</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Exakt=5 Pkt. · Differenz=3 Pkt. · Gewinner=2 Pkt.
            </p>
          </div>
          <LeaderboardTable entries={rankedEntries} currentUserId={currentUserId} liveMatch={liveMatch} predictions={predictions} />
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
                : <LeaderboardTable entries={drillEntries} currentUserId={currentUserId} liveMatch={liveMatch} predictions={predictions} />}
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
                Ø Punkte pro Mitglied · fair unabhängig von der Klassengröße · Klasse anklicken für Einzelrangliste
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
                      {g.member_count} Mitglied{g.member_count !== 1 ? 'er' : ''} · {g.total_points} Pkt. gesamt
                    </span>
                  </div>

                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
                    textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                    color: i === 0 ? 'var(--good)' : 'var(--ink)',
                  }}>
                    Ø {g.avg_points}
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
