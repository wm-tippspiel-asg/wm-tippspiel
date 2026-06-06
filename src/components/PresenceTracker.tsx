'use client'

import { useEffect } from 'react'

export function PresenceTracker() {
  useEffect(() => {
    const send = () => { fetch('/api/presence/heartbeat', { method: 'POST' }).catch(() => {}) }
    send()
    const id = setInterval(send, 60_000)
    return () => clearInterval(id)
  }, [])
  return null
}
