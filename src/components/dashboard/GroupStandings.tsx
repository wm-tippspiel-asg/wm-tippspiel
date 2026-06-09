'use client'

import { useState, useEffect } from 'react'

interface Team {
  position: number
  name: string
  crest: string
  played: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
}

interface Group {
  group: string
  teams: Team[]
}

export function GroupStandings() {
  const [standings, setStandings] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/football/standings')
        const d = await res.json() as { success: boolean; data?: Group[]; error?: string }
        if (!d.success) { setError(d.error ?? 'Fehler'); return }
        setStandings(d.data ?? [])
      } catch { setError('Verbindungsfehler') } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-8 text-gray-500">Lädt...</div>
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>
  if (standings.length === 0) return <div className="text-center py-8 text-gray-500">Keine Daten</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {standings.map((group) => (
        <div key={group.group} className="wm-card">
          <div style={{ padding: '16px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              Gruppe {group.group.replace('GROUP_', '')}
            </h3>
          </div>

          <div style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 32px 32px 40px',
              gap: 8,
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}>
              <div style={{ textAlign: 'center' }}>#</div>
              <div>Team</div>
              <div style={{ textAlign: 'center' }}>Sp.</div>
              <div style={{ textAlign: 'center' }}>TD</div>
              <div style={{ textAlign: 'right' }}>Pkt</div>
            </div>

            {/* Rows */}
            {group.teams.map((t) => (
              <div key={t.position} style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr 32px 32px 40px',
                gap: 8,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {t.position}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {t.crest && <img src={t.crest} alt="" style={{ width: 20, height: 20, borderRadius: 3 }} />}
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </span>
                </div>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)' }}>{t.played}</div>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                  {t.goalsFor}:{t.goalsAgainst}
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: t.position === 1 ? 'var(--good)' : 'var(--ink)' }}>
                  {t.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
