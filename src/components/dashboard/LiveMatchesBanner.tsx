'use client'

import { useState, useEffect } from 'react'
import type { Match } from '@/types'

function LiveDot() {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: '#ef4444', opacity: 0.75,
        animation: 'ping 1.2s cubic-bezier(0,0,.2,1) infinite',
      }} />
      <span style={{ borderRadius: '50%', width: 10, height: 10, background: '#ef4444', display: 'block' }} />
    </span>
  )
}

function ScoreCard({ match }: { match: Match }) {
  const homeFlag = match.home_team_flag
  const awayFlag = match.away_team_flag
  const homeScore = match.home_score ?? '–'
  const awayScore = match.away_score ?? '–'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '14px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minWidth: 220,
      flex: '0 0 auto',
    }}>
      {/* Live badge + group */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LiveDot />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Live
          </span>
        </div>
        {match.group_name && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
            {match.group_name}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        {/* Home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 32 }}>
            {homeFlag ?? '🏳️'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72 }}>
            {match.home_team}
          </span>
        </div>

        {/* Score */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--ink)',
          letterSpacing: '.02em',
          minWidth: 56,
          textAlign: 'center',
          lineHeight: 1,
        }}>
          {homeScore} : {awayScore}
        </div>

        {/* Away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 32 }}>
            {awayFlag ?? '🏳️'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72 }}>
            {match.away_team}
          </span>
        </div>
      </div>
    </div>
  )
}

export function LiveMatchesBanner() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loaded, setLoaded] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/matches?status=live')
      const d = await res.json() as { success: boolean; data?: Match[] }
      if (d.success) setMatches(d.data ?? [])
    } catch {}
    setLoaded(true)
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!loaded || matches.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <LiveDot />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
            Jetzt live
          </span>
          <span style={{
            background: '#ef444420',
            color: '#ef4444',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 99,
          }}>
            {matches.length} {matches.length === 1 ? 'Spiel' : 'Spiele'}
          </span>
        </div>
        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}>
          {matches.map(m => <ScoreCard key={m.id} match={m} />)}
        </div>
      </div>
    </>
  )
}
