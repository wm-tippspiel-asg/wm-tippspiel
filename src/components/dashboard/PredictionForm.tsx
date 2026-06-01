'use client'

import { useState, useEffect } from 'react'
import { Check, Save } from 'lucide-react'
import { isMatchLocked } from '@/lib/utils'
import type { Match, Prediction } from '@/types'

interface Props {
  match: Match
  existing?: Prediction | null
  onSaved?: () => void
}

export function PredictionForm({ match, existing, onSaved }: Props) {
  const [home, setHome] = useState(existing?.home_score?.toString() ?? '')
  const [away, setAway] = useState(existing?.away_score?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(isMatchLocked(match.match_time))

  useEffect(() => {
    const t = setInterval(() => setLocked(isMatchLocked(match.match_time)), 10_000)
    return () => clearInterval(t)
  }, [match.match_time])

  const isDisabled = locked || match.status === 'locked' || match.status === 'finished' || match.status === 'cancelled'

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (isDisabled) return
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) { setError('Ungültige Eingabe'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: match.id, home_score: h, away_score: a }),
      })
      const d = await res.json() as { success: boolean; error?: string }
      if (!d.success) { setError(d.error ?? 'Fehler'); return }
      setSaved(true); setTimeout(() => setSaved(false), 2500); onSaved?.()
    } catch { setError('Verbindungsfehler') } finally { setLoading(false) }
  }

  // Finished match: show tip result
  if (isDisabled && match.status === 'finished') {
    const pts = existing?.points
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-lg font-bold text-gray-700 dark:text-gray-300">
          <span>{existing?.home_score ?? '–'}</span>
          <span className="text-gray-400">:</span>
          <span>{existing?.away_score ?? '–'}</span>
        </div>
        {pts !== null && pts !== undefined ? (
          <span className={`badge font-bold text-sm ${pts === 5 ? 'badge-green' : pts >= 2 ? 'badge-blue' : 'badge-slate'}`}>
            {pts > 0 ? `+${pts}` : '0'} Pkt
          </span>
        ) : (
          <span className="text-sm text-gray-400">Kein Tipp</span>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={home}
        onChange={(e) => { if (/^\d{0,2}$/.test(e.target.value)) { setHome(e.target.value); setSaved(false) } }}
        disabled={isDisabled || loading}
        placeholder="0" className="score-input" aria-label="Heim-Tore" />
      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--muted-2)' }}>:</span>
      <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={away}
        onChange={(e) => { if (/^\d{0,2}$/.test(e.target.value)) { setAway(e.target.value); setSaved(false) } }}
        disabled={isDisabled || loading}
        placeholder="0" className="score-input" aria-label="Auswärts-Tore" />

      {!isDisabled && (
        <button type="submit" disabled={loading || home === '' || away === ''}
          aria-label="Tipp speichern"
          className={`p-2 rounded-lg transition-colors ${
            saved
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
              : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333]'
          } disabled:opacity-40`}>
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        </button>
      )}

      {error && <span className="text-sm text-red-500">{error}</span>}
      {isDisabled && match.status !== 'finished' && (
        <span className="text-sm text-amber-500">Gesperrt</span>
      )}
    </form>
  )
}
