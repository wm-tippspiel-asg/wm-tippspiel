'use client'

import { useEffect, useState } from 'react'
import { getCountdown } from '@/lib/utils'

interface CountdownTimerProps {
  matchTime: string
}

export function CountdownTimer({ matchTime }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(getCountdown(matchTime))

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown(matchTime))
    }, 1000)
    return () => clearInterval(timer)
  }, [matchTime])

  if (countdown.isPast && !countdown.isLive) {
    return <span className="text-xs text-slate-400">Beendet</span>
  }

  if (countdown.isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Live
      </span>
    )
  }

  const parts: string[] = []
  if (countdown.days > 0) parts.push(`${countdown.days}T`)
  if (countdown.hours > 0 || countdown.days > 0) parts.push(`${countdown.hours}Std`)
  if (countdown.days === 0) parts.push(`${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`)

  return (
    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
      {parts.join(' ')}
    </span>
  )
}
