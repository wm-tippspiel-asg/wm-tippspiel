'use client'

import { useState, useEffect } from 'react'
import { Check, Trophy, Target } from 'lucide-react'

const DEADLINE = new Date('2026-06-11T19:00:00Z')

const WM_TEAMS = [
  '🇲🇽 Mexiko', '🇿🇦 Südafrika', '🇰🇷 Südkorea', '🇨🇿 Tschechien',
  '🇨🇦 Kanada', '🇧🇦 Bosnien-Herzegowina', '🇶🇦 Katar', '🇨🇭 Schweiz',
  '🇧🇷 Brasilien', '🇲🇦 Marokko', '🇭🇹 Haiti', '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Schottland',
  '🇺🇸 USA', '🇹🇷 Türkei', '🇦🇺 Australien', '🇵🇾 Paraguay',
  '🇩🇪 Deutschland', '🇨🇼 Curaçao', '🇨🇮 Elfenbeinküste', '🇪🇨 Ecuador',
  '🇳🇱 Niederlande', '🇯🇵 Japan', '🇸🇪 Schweden', '🇹🇳 Tunesien',
  '🇧🇪 Belgien', '🇪🇬 Ägypten', '🇮🇷 Iran', '🇳🇿 Neuseeland',
  '🇪🇸 Spanien', '🇨🇻 Kap Verde', '🇸🇦 Saudi-Arabien', '🇺🇾 Uruguay',
  '🇫🇷 Frankreich', '🇸🇳 Senegal', '🇮🇶 Irak', '🇳🇴 Norwegen',
  '🇦🇹 Österreich', '🇦🇷 Argentinien', '🇯🇴 Jordanien', '🇩🇿 Algerien',
  '🇵🇹 Portugal', '🇨🇩 DR Kongo', '🇺🇿 Usbekistan', '🇨🇴 Kolumbien',
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', '🇭🇷 Kroatien', '🇬🇭 Ghana', '🇵🇦 Panama',
]

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('')
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    function update() {
      const diff = DEADLINE.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft(''); setLocked(true); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(d > 0 ? `${d}T ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  return { timeLeft, locked }
}

export default function SpecialBetsPage() {
  const { timeLeft, locked } = useCountdown()
  const [winner, setWinner] = useState('')
  const [topScorer, setTopScorer] = useState('')
  const [savedWinner, setSavedWinner] = useState('')
  const [savedTopScorer, setSavedTopScorer] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/special-bets')
      .then(r => r.json())
      .then((d: { success: boolean; data?: { bet_type: string; prediction: string }[] }) => {
        if (!d.success || !d.data) return
        const w = d.data.find(b => b.bet_type === 'winner')
        const t = d.data.find(b => b.bet_type === 'top_scorer')
        if (w) { setWinner(w.prediction); setSavedWinner(w.prediction) }
        if (t) { setTopScorer(t.prediction); setSavedTopScorer(t.prediction) }
      })
  }, [])

  async function save(type: 'winner' | 'top_scorer', value: string) {
    if (!value || locked) return
    setSaving(type); setError('')
    const res = await fetch('/api/special-bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_type: type, prediction: value }),
    })
    const d = await res.json() as { success: boolean; error?: string }
    if (d.success) {
      if (type === 'winner') setSavedWinner(value)
      else setSavedTopScorer(value)
      setSaved(type)
      setTimeout(() => setSaved(null), 2500)
    } else {
      setError(d.error ?? 'Fehler')
    }
    setSaving(null)
  }

  return (
    <div className="wm-fade-in" style={{ maxWidth: 600, display: 'grid', gap: 24 }}>

      {/* Header */}
      <div>
        <div className="wm-eyebrow">Sondertipps</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
          letterSpacing: '-0.02em', color: 'var(--ink)', margin: '6px 0 0' }}>
          WM-Prognosen
        </h1>
        <p style={{ marginTop: 8, fontSize: 15, color: 'var(--muted)' }}>
          Tippe auf den Turniersieger und den Torschützenkönig.Nur bis zum Anpfiff des ersten Spiels möglich.
        </p>
      </div>

      {/* Countdown or locked */}
      <div className="wm-card wm-card-pad" style={{
        background: locked ? 'color-mix(in oklab, var(--live) 8%, var(--bg))' : 'var(--accent-soft)',
        borderColor: locked ? 'color-mix(in oklab, var(--live) 25%, var(--bg))' : 'var(--accent-line)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontSize: 28 }}>{locked ? '🔒' : ''}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
            {locked ? 'Tipps gesperrt — WM hat begonnen!' : `Noch ${timeLeft} Zeit`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            Deadline: 11. Juni 2026 · 21:00 Uhr (CEST)
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'color-mix(in oklab, var(--live) 10%, var(--bg))',
          border: '1px solid color-mix(in oklab, var(--live) 25%, var(--bg))', color: 'var(--live)', fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Winner */}
      <div className="wm-card wm-card-pad" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)',
            display: 'grid', placeItems: 'center' }}>
            <Trophy size={18} style={{ color: 'var(--accent-strong)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
              Turniersieger
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Welches Land wird Weltmeister?</div>
          </div>
          {savedWinner && (
            <span className="wm-chip wm-chip-open" style={{ marginLeft: 'auto' }}>
              <Check size={12} /> Getippt
            </span>
          )}
        </div>

        <select value={winner} onChange={e => setWinner(e.target.value)} disabled={locked}
          className="input-base" style={{ fontSize: 15 }}>
          <option value="">— Team auswählen —</option>
          {WM_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {!locked && (
          <button onClick={() => save('winner', winner)} disabled={!winner || saving === 'winner' || winner === savedWinner}
            className="wm-btn wm-btn-primary" style={{ justifyContent: 'center' }}>
            {saving === 'winner' ? 'Speichern…' : saved === 'winner' ? '✓ Gespeichert!' : 'Tipp speichern'}
          </button>
        )}
      </div>

      {/* Top scorer */}
      <div className="wm-card wm-card-pad" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)',
            display: 'grid', placeItems: 'center' }}>
            <Target size={18} style={{ color: 'var(--accent-strong)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
              Torschützenkönig
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Wer schießt die meisten Tore?</div>
          </div>
          {savedTopScorer && (
            <span className="wm-chip wm-chip-open" style={{ marginLeft: 'auto' }}>
              <Check size={12} /> Getippt
            </span>
          )}
        </div>

        <input type="text" value={topScorer} onChange={e => setTopScorer(e.target.value)}
          disabled={locked} placeholder="z.B. Kylian Mbappé"
          className="input-base" maxLength={60} />

        {!locked && (
          <button onClick={() => save('top_scorer', topScorer)} disabled={!topScorer.trim() || saving === 'top_scorer' || topScorer === savedTopScorer}
            className="wm-btn wm-btn-primary" style={{ justifyContent: 'center' }}>
            {saving === 'top_scorer' ? 'Speichern…' : saved === 'top_scorer' ? '✓ Gespeichert!' : 'Tipp speichern'}
          </button>
        )}
      </div>
    </div>
  )
}
