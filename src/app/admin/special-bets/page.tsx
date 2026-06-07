'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, Check, UserCheck, Trash2 } from 'lucide-react'

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
interface UserBet { user_id: string; username: string; bet_type: string; prediction: string; points_awarded: number }

export default function AdminSpecialBetsPage() {
  const [stats, setStats] = useState<BetStat[]>([])
  const [results, setResults] = useState<BetResult[]>([])
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [winner, setWinner] = useState('')
  const [topScorer, setTopScorer] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [selectedScorers, setSelectedScorers] = useState<Set<string>>(new Set())

  function load() {
    fetch('/api/admin/special-bets/resolve')
      .then(r => r.json() as Promise<{ success: boolean; data?: { results: BetResult[]; stats: BetStat[]; userBets: UserBet[] } }>)
      .then((d) => {
        if (!d.success || !d.data) return
        setStats(d.data.stats)
        setResults(d.data.results)
        setUserBets(d.data.userBets)
        const w = d.data.results.find(r => r.bet_type === 'winner')
        const t = d.data.results.find(r => r.bet_type === 'top_scorer')
        if (w) setWinner(w.result)
        if (t) setTopScorer(t.result)
      })
  }

  useEffect(() => { load() }, [])

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
      load()
    } else {
      setMsg(`Fehler: ${d.error}`)
    }
    setLoading(null)
  }

  async function resetResult(bet_type: string) {
    if (!confirm(`Ergebnis für "${bet_type === 'winner' ? 'Turniersieger' : 'Torschützenkönig'}" wirklich löschen und Punkte zurücknehmen?`)) return
    setLoading('reset-' + bet_type); setMsg('')
    const res = await fetch('/api/admin/special-bets/resolve', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_type }),
    })
    const d = await res.json() as { success: boolean; data?: { reverted: number }; error?: string }
    if (d.success) {
      setMsg(`✓ Eintrag gelöscht. ${d.data?.reverted} Spieler-Punkte zurückgenommen.`)
      load()
    } else {
      setMsg(`Fehler: ${d.error}`)
    }
    setLoading(null)
  }

  async function awardManual(bet_type: string) {
    const user_ids = [...selectedScorers]
    if (user_ids.length === 0) return
    setLoading('manual'); setMsg('')
    const res = await fetch('/api/admin/special-bets/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_type, user_ids }),
    })
    const d = await res.json() as { success: boolean; data?: { awarded: number; points: number }; error?: string }
    if (d.success) {
      setMsg(`✓ ${d.data?.awarded} Spieler manuell mit je ${d.data?.points} Punkten ausgezeichnet!`)
      setSelectedScorers(new Set())
      load()
    } else {
      setMsg(`Fehler: ${d.error}`)
    }
    setLoading(null)
  }

  function toggleScorer(user_id: string) {
    setSelectedScorers(prev => {
      const next = new Set(prev)
      next.has(user_id) ? next.delete(user_id) : next.add(user_id)
      return next
    })
  }

  const winnerStats = stats.filter(s => s.bet_type === 'winner')
  const scorerStats = stats.filter(s => s.bet_type === 'top_scorer')
  const scorerBets = userBets.filter(b => b.bet_type === 'top_scorer')

  return (
    <div className="wm-fade-in" style={{ display: 'grid', gap: 24, maxWidth: 800 }}>
      <div>
        <div className="wm-eyebrow">Admin</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '6px 0 0' }}>
          Sondertipps auswerten
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
          Trage das offizielle Ergebnis ein — Punkte werden automatisch vergeben. Tippfehler können manuell korrigiert werden.
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
        {results.find(r => r.bet_type === 'winner') && (
          <button onClick={() => resetResult('winner')} disabled={loading === 'reset-winner'}
            className="wm-btn" style={{ justifyContent: 'center', color: 'var(--error, #dc2626)', borderColor: 'var(--error, #dc2626)' }}>
            <Trash2 size={14} /> {loading === 'reset-winner' ? 'Lösche…' : 'Eintrag löschen & Punkte zurücknehmen'}
          </button>
        )}
      </div>

      {/* Top scorer — automatisch */}
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
          {loading === 'top_scorer' ? 'Berechne…' : 'Automatisch vergeben (exakter Name)'}
        </button>
        {results.find(r => r.bet_type === 'top_scorer') && (
          <button onClick={() => resetResult('top_scorer')} disabled={loading === 'reset-top_scorer'}
            className="wm-btn" style={{ justifyContent: 'center', color: 'var(--error, #dc2626)', borderColor: 'var(--error, #dc2626)' }}>
            <Trash2 size={14} /> {loading === 'reset-top_scorer' ? 'Lösche…' : 'Eintrag löschen & Punkte zurücknehmen'}
          </button>
        )}
      </div>

      {/* Top scorer — manuelle Vergabe */}
      {scorerBets.length > 0 && (
        <div className="wm-card wm-card-pad" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={20} style={{ color: 'var(--accent-strong)' }} />
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                Manuelle Vergabe — Tippfehler
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                Haken setzen bei Spielern, die den richtigen Namen gemeint haben (z.B. "Mbappe" statt "Mbappé").
                Bereits ausgezeichnete Spieler sind gesperrt.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            {scorerBets.map(b => (
              <label key={b.user_id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: b.points_awarded > 0 ? 'var(--surface-2)' : 'var(--surface)',
                border: `1px solid ${selectedScorers.has(b.user_id) ? 'var(--accent)' : 'var(--border)'}`,
                cursor: b.points_awarded > 0 ? 'default' : 'pointer',
                opacity: b.points_awarded > 0 ? 0.6 : 1,
              }}>
                <input
                  type="checkbox"
                  disabled={b.points_awarded > 0}
                  checked={b.points_awarded > 0 || selectedScorers.has(b.user_id)}
                  onChange={() => toggleScorer(b.user_id)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)', flexShrink: 0 }}
                />
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', minWidth: 120 }}>
                  {b.username}
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)', flex: 1 }}>
                  „{b.prediction}"
                </span>
                {b.points_awarded > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--good)',
                    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Check size={13} /> +{b.points_awarded} Pkt.
                  </span>
                )}
              </label>
            ))}
          </div>

          <button
            onClick={() => awardManual('top_scorer')}
            disabled={selectedScorers.size === 0 || loading === 'manual'}
            className="wm-btn wm-btn-primary"
            style={{ justifyContent: 'center' }}>
            {loading === 'manual'
              ? 'Vergebe…'
              : `${selectedScorers.size} Spieler manuell auszeichnen`}
          </button>
        </div>
      )}
    </div>
  )
}
