'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function RecalculateAction() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function recalculate() {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/leaderboard/recalculate', { method: 'POST' })
      const d = await res.json() as { success: boolean; message?: string }
      setMsg(d.message ?? (d.success ? 'Fertig!' : 'Fehler'))
    } catch {
      setMsg('Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-1">
      <Button size="sm" variant="secondary" onClick={recalculate} loading={loading}>
        Neu berechnen
      </Button>
      {msg && <p className="text-xs text-slate-500 dark:text-slate-400">{msg}</p>}
    </div>
  )
}
