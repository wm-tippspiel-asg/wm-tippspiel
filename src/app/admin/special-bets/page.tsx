'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, Check } from 'lucide-react'

const WM_TEAMS = [
  'Mexiko','Südafrika','Südkorea','Tschechien',
  'Kanada','Bosnien-Herzegowina','Katar','Schweiz',
  'Brasilien','Marokko','Haiti','Schottland',
  'USA','Türkei','Australien','Paraguay',
  'Deutschland','Curaçao','Elfenbeinküste','Ecuador',
  'Niederlande','Japan','Schweden','Tunesien',
  'Belgien','Ägypten','Iran','Neuseeland',
  'Spanien','Kap Verde','Saudi-Arabien','Uruguay',
  'Frankreich','Senegal','Irak','Norwegen',
  'Österreich','Argentinien','Jordanien','Algerien',
  'Portugal','DR Kongo','Usbekistan','Kolumbien',
  'England','Kroatien','Ghana','Panama',
]

export const runtime = 'edge'

interface BetStat { bet_type: string; prediction: string; count: number }
interface BetResult { bet_type: string; result: string; resolved_at: string }

export default function AdminSpecialBetsPage() {
  const [stats, setStats] = useState<BetStat[]>([])
  const [results, setResults] = useState<BetResult[]>([])
  const [winner, setWinner] = useState('')
  const [topScorer, setTopScorer] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/special-bets/resolve')
      .then(r => r.json())
      .then((d: { success: boolean; data?: { results: BetResult[]; stats: BetStat[] } }) => {
        if (!d.success || !d.data) return
        setStats(d.data.stats)
        setResults(d.data.results)
        const w = d.data.results.find(r => r.bet_type === 'winner')
        const t = d.data.results.find(r => r.bet_type === 'top_scorer')
        if (w) setWinner(w.result)
        if (t) setTopScorer(t.result)
      })
  }, [])

  async function resolve(bet_type: string, result: string) {
    if (!result.trim()) return
    setLoading(bet_type); setMsg('')
    const res = await fetch('/api/admin/special-bets/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_type, result }),
    })
    const d = await res.json() as { success: boolean; data?: { awarded: number; points: number }; error?: string }
    if (d.success) {
      setMsg(`✓ ${d.data?.awarded} Spieler erhalten je ${d.data?.points} Punkte!`)
    } else {
      setMsg(`Fehler: ${d.error}`)
    }
    setLoading(null)
  }

  const winnerStats = stats.filter(s => s.bet_type === 'winner')
  const scorerStats = stats.filter(s => s.bet_type === 'top_scorer')

  return (
    <div className="wm-fade-in" style={{ display: 'grid', gap: 24, maxWidth: 800 }}>
      <div>
        <div className="wm-eyebrow">Admin</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '6px 0 0' }}>
          Sondertipps auswerten
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
          Trage das offizielle Ergebnis ein — Punkte werden automatisch vergeben (20 Pkt. Sieger, 15 Pkt. Torschütze).
        </p>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--accent-soft)',
          border: '1px solid var(--accent-line)', color: 'var(--accent-strong)', fontWeight: 600, fontSize: 14 }}>
          {msg}
        </div>
      )}

      {/* Winner */}
      <div className="wm-card wm-card-pad" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trophy size={20} style={{ color: 'var(--accent-strong)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Turniersieger — 20 Punkte
          </h2>
        </div>

        {winnerStats.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              Top-Tipps der Spieler
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {winnerStats.slice(0, 8).map(s => (
                <span key={s.prediction} className="wm-chip" style={{ cursor: 'pointer' }}
                  onClick={() => setWinner(s.prediction.replace(/^.+? /, ''))}>
                  {s.prediction} · <b>{s.count}</b>
                </span>
              ))}
            </div>
          </div>
        )}

        <select value={winner} onChange={e => setWinner(e.target.value)} className="input-base">
          <option value="">— Offiziellen Sieger auswählen —</option>
          {WM_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <button onClick={() => resolve('winner', winner)} disabled={!winner || loading === 'winner'}
          className="wm-btn wm-btn-primary" style={{ justifyContent: 'center' }}>
          {loading === 'winner' ? 'Berechne…' : 'Punkte vergeben'}
        </button>
      </div>

      {/* Top scorer */}
      <div className="wm-card wm-card-pad" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Target size={20} style={{ color: 'var(--accent-strong)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Torschützenkönig — 15 Punkte
          </h2>
        </div>

        {scorerStats.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              Top-Tipps der Spieler
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {scorerStats.slice(0, 8).map(s => (
                <span key={s.prediction} className="wm-chip" style={{ cursor: 'pointer' }}
                  onClick={() => setTopScorer(s.prediction)}>
                  {s.prediction} · <b>{s.count}</b>
                </span>
              ))}
            </div>
          </div>
        )}

        <input type="text" value={topScorer} onChange={e => setTopScorer(e.target.value)}
          placeholder="z.B. Kylian Mbappé" className="input-base" />

        <button onClick={() => resolve('top_scorer', topScorer)} disabled={!topScorer.trim() || loading === 'top_scorer'}
          className="wm-btn wm-btn-primary" style={{ justifyContent: 'center' }}>
          {loading === 'top_scorer' ? 'Berechne…' : 'Punkte vergeben'}
        </button>
      </div>
    </div>
  )
}
