'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function AutoUpdateAction() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  async function run() {
    setLoading(true)
    setMsg('')
    setIsError(false)
    try {
      const res = await fetch('/api/admin/auto-update-scores', { method: 'POST' })
      const d = await res.json() as { success: boolean; data?: { updated: number }; error?: string }
      if (d.success) {
        setMsg(d.data?.updated ? `${d.data.updated} Spiel(e) aktualisiert ✓` : 'Keine neuen Ergebnisse')
      } else {
        setIsError(true)
        setMsg(d.error ?? 'Fehler beim Abrufen')
      }
    } catch {
      setIsError(true)
      setMsg('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-1">
      <Button size="sm" variant="secondary" onClick={run} loading={loading}>
        Jetzt abrufen
      </Button>
      {msg && (
        <p className={`text-xs ${isError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
