'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Trophy, Target, ArrowRight } from 'lucide-react'

const DEADLINE = new Date('2026-06-11T19:00:00Z')

interface Props {
  hasWinner: boolean
  hasTopScorer: boolean
}

export function DashboardCountdown({ hasWinner, hasTopScorer }: Props) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    function update() {
      const diff = DEADLINE.getTime() - Date.now()
      if (diff <= 0) { setLocked(true); setTimeLeft(null); return }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  if (locked) return null

  const allDone = hasWinner && hasTopScorer
  const missing = [!hasWinner && 'Turniersieger', !hasTopScorer && 'Torschützenkönig'].filter(Boolean).join(' & ')

  return (
    <div className="wm-card" style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20,
      padding: '18px 22px',
      background: allDone ? 'var(--accent-soft)' : 'color-mix(in oklab, var(--warn) 8%, var(--bg))',
      borderColor: allDone ? 'var(--accent-line)' : 'color-mix(in oklab, var(--warn) 30%, var(--bg))',
    }}>

      {/* Countdown */}
      {timeLeft && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {[
            { v: timeLeft.d, l: 'Tage' },
            { v: timeLeft.h, l: 'Std' },
            { v: timeLeft.m, l: 'Min' },
            { v: timeLeft.s, l: 'Sek' },
          ].map(({ v, l }) => (
            <div key={l} style={{ textAlign: 'center', minWidth: 46,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '6px 8px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
                color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {String(v).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
          {allDone ? '✓ Alle Sondertipps abgegeben!' : `Noch nicht getippt: ${missing}`}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
          {allDone
            ? 'Turniersieger & Torschützenkönig sind gespeichert.'
            : 'Tippe jetzt! Nur bis zum ersten Anpfiff möglich!'}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
            fontWeight: 600, color: hasWinner ? 'var(--good)' : 'var(--muted)' }}>
            <Trophy size={14} />
            Turniersieger {hasWinner ? '✓' : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
            fontWeight: 600, color: hasTopScorer ? 'var(--good)' : 'var(--muted)' }}>
            <Target size={14} />
            Torschützenkönig {hasTopScorer ? '✓' : ''}
          </span>
        </div>
      </div>

      {!allDone && (
        <Link href="/special-bets" className="wm-btn wm-btn-primary" style={{ flexShrink: 0 }}>
          Jetzt tippen <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}
