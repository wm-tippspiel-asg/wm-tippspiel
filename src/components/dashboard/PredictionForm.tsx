'use client'

import { useState, useEffect } from 'react'
import { Check, Save } from 'lucide-react'
import { isMatchLocked } from '@/lib/utils'
import type { Match, Prediction } from '@/types'

interface PredictionFormProps {
  match: Match
  existing?: Prediction | null
  onSaved?: () => void
}

export function PredictionForm({ match, existing, onSaved }: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState<string>(existing?.home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState<string>(existing?.away_score?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(isMatchLocked(match.match_time))

  // Update lock state every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLocked(isMatchLocked(match.match_time))
    }, 10_000)
    return () => clearInterval(interval)
  }, [match.match_time])

  const isDisabled = locked || match.status === 'locked' || match.status === 'finished' || match.status === 'cancelled'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDisabled) return

    const h = parseInt(homeScore, 10)
    const a = parseInt(awayScore, 10)

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('Bitte gültige Zahlen eingeben.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: match.id, home_score: h, away_score: a }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Fehler beim Speichern.')
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.()
    } catch {
      setError('Verbindungsfehler.')
    } finally {
      setLoading(false)
    }
  }

  if (isDisabled && match.status === 'finished' && match.home_score !== null) {
    const points = existing?.points
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="font-semibold">{existing?.home_score ?? '–'}</span>
          <span className="text-slate-400">:</span>
          <span className="font-semibold">{existing?.away_score ?? '–'}</span>
        </div>
        {points !== null && points !== undefined && (
          <span className={`badge text-xs font-semibold ${
            points === 5 ? 'badge-green' : points >= 2 ? 'badge-blue' : 'badge-slate'
          }`}>
            {points > 0 ? `+${points}` : '0'} Pkt.
          </span>
        )}
        {!existing && <span className="text-xs text-slate-400">Kein Tipp</span>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={99}
        value={homeScore}
        onChange={(e) => { setHomeScore(e.target.value); setSaved(false) }}
        disabled={isDisabled || loading}
        placeholder="0"
        className="score-input"
        aria-label={`Tipp ${match.home_team} Tore`}
      />
      <span className="text-slate-400 font-bold">:</span>
      <input
        type="number"
        min={0}
        max={99}
        value={awayScore}
        onChange={(e) => { setAwayScore(e.target.value); setSaved(false) }}
        disabled={isDisabled || loading}
        placeholder="0"
        className="score-input"
        aria-label={`Tipp ${match.away_team} Tore`}
      />

      {!isDisabled && (
        <button
          type="submit"
          disabled={loading || homeScore === '' || awayScore === ''}
          className={`p-1.5 rounded-lg transition-colors text-sm ${
            saved
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/60'
          } disabled:opacity-50`}
          aria-label="Tipp speichern"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        </button>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
      {isDisabled && !match.status.includes('finished') && (
        <span className="text-xs text-amber-500 dark:text-amber-400">Gesperrt</span>
      )}
    </form>
  )
}
