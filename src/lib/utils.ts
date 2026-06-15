import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { MatchRound } from '@/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  })
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  })
}

export function toDateTimeLocalBerlin(dateString: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString)).replace(' ', 'T')
}

export function fromDateTimeLocalBerlin(berlinLocalStr: string): string {
  const asUTC = new Date(berlinLocalStr + 'Z')
  const berlinOfUTC = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(asUTC).replace(' ', 'T')
  const offsetMs = new Date(berlinOfUTC + 'Z').getTime() - asUTC.getTime()
  return new Date(asUTC.getTime() - offsetMs).toISOString()
}

export function getRoundLabel(round: MatchRound): string {
  const labels: Record<MatchRound, string> = {
    group: 'Gruppenphase',
    round_of_16: 'Sechzehntelfinale',
    round_of_8: 'Achtelfinale',
    quarter_final: 'Viertelfinale',
    semi_final: 'Halbfinale',
    final: 'Finale',
  }
  return labels[round]
}

export function getCountdown(matchTime: string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isLive: boolean
  isPast: boolean
} {
  const now = Date.now()
  const matchMs = new Date(matchTime).getTime()
  const diff = matchMs - now

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: diff > -120 * 60 * 1000, isPast: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, isLive: false, isPast: false }
}

export function isMatchLocked(matchTime: string): boolean {
  return new Date(matchTime).getTime() <= Date.now()
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

export function flagEmojiToCountryCode(emoji: string): string | null {
  if (!emoji) return null
  const chars = [...emoji]
  if (chars.length < 2) return null
  try {
    const code = chars.slice(0, 2).map(c => {
      const cp = c.codePointAt(0)
      if (!cp || cp < 0x1F1E6 || cp > 0x1F1FF) return null
      return String.fromCharCode(cp - 0x1F1A5)
    }).join('')
    return code.length === 2 && /^[A-Z]{2}$/.test(code) ? code.toLowerCase() : null
  } catch {
    return null
  }
}
