'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function ClearCacheAction() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  async function run() {
    setLoading(true)
    setMsg('')
    setIsError(false)
    try {
      const res = await fetch('/api/admin/cache', { method: 'DELETE' })
      const d = await res.json() as { success: boolean; deleted?: string[]; error?: string }
      if (d.success) {
        setMsg(`Cache geleert: ${d.deleted?.join(', ')} ✓`)
      } else {
        setIsError(true)
        setMsg(d.error ?? 'Fehler')
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
        Cache leeren
      </Button>
      {msg && (
        <p className={`text-xs ${isError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
