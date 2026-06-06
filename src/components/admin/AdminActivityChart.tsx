'use client'

import { useMemo, useState } from 'react'

interface DayCount { day: string; count: number }
type Gran = 'day' | 'week' | 'month'

interface Bucket { key: string; label: string; sub?: string; tips: number; logins: number }

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function ymd(d: Date): string { return d.toISOString().slice(0, 10) }

// Montag der Woche von d (UTC)
function weekStart(d: Date): Date {
  const r = new Date(d)
  const dow = (r.getUTCDay() + 6) % 7 // Mo=0 … So=6
  r.setUTCDate(r.getUTCDate() - dow)
  r.setUTCHours(0, 0, 0, 0)
  return r
}

function buildBuckets(gran: Gran, tipsMap: Map<string, number>, loginsMap: Map<string, number>): Bucket[] {
  const now = new Date()
  const out: Bucket[] = []

  if (gran === 'day') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setUTCDate(d.getUTCDate() - i)
      const key = ymd(d)
      out.push({
        key,
        label: `${d.getUTCDate()}.${d.getUTCMonth() + 1}`,
        sub: DAYS[d.getUTCDay()],
        tips: tipsMap.get(key) ?? 0,
        logins: loginsMap.get(key) ?? 0,
      })
    }
  } else if (gran === 'week') {
    const thisWeek = weekStart(now)
    for (let i = 11; i >= 0; i--) {
      const ws = new Date(thisWeek); ws.setUTCDate(ws.getUTCDate() - i * 7)
      let tips = 0, logins = 0
      for (let dd = 0; dd < 7; dd++) {
        const d = new Date(ws); d.setUTCDate(d.getUTCDate() + dd)
        const key = ymd(d)
        tips += tipsMap.get(key) ?? 0
        logins += loginsMap.get(key) ?? 0
      }
      const we = new Date(ws); we.setUTCDate(we.getUTCDate() + 6)
      out.push({
        key: ymd(ws),
        label: `${ws.getUTCDate()}.${ws.getUTCMonth() + 1}`,
        sub: `KW`,
        tips, logins,
      })
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      const prefix = `${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, '0')}`
      let tips = 0, logins = 0
      for (const [k, v] of tipsMap) if (k.startsWith(prefix)) tips += v
      for (const [k, v] of loginsMap) if (k.startsWith(prefix)) logins += v
      out.push({ key: prefix, label: MONTHS[m.getUTCMonth()] ?? '', sub: `${m.getUTCFullYear()}`.slice(2), tips, logins })
    }
  }
  return out
}

export function AdminActivityChart({ tips, logins }: { tips: DayCount[]; logins: DayCount[] }) {
  const [gran, setGran] = useState<Gran>('day')

  const tipsMap = useMemo(() => new Map(tips.map(d => [d.day, d.count])), [tips])
  const loginsMap = useMemo(() => new Map(logins.map(d => [d.day, d.count])), [logins])
  const buckets = useMemo(() => buildBuckets(gran, tipsMap, loginsMap), [gran, tipsMap, loginsMap])

  const totalTips = buckets.reduce((s, b) => s + b.tips, 0)
  const totalLogins = buckets.reduce((s, b) => s + b.logins, 0)
  const maxVal = Math.max(...buckets.map(b => Math.max(b.tips, b.logins)), 1)

  // SVG-Geometrie
  const n = buckets.length
  const W = 640, H = 220
  const PL = 30, PR = 8, PT = 12, PB = 34
  const chartW = W - PL - PR, chartH = H - PT - PB
  const groupW = chartW / n
  const barW = Math.min(groupW * 0.32, 14)

  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  const tabs: { id: Gran; label: string }[] = [
    { id: 'day', label: 'Pro Tag' },
    { id: 'week', label: 'Pro Woche' },
    { id: 'month', label: 'Pro Monat' },
  ]

  return (
    <div className="stats-chart-card">
      <div className="aac-head">
        <div className="aac-summary">
          <span><strong style={{ color: '#6366f1' }}>{totalTips}</strong> Tipps</span>
          <span><strong style={{ color: '#10b981' }}>{totalLogins}</strong> Logins</span>
        </div>
        <div className="aac-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setGran(t.id)}
              className={`aac-tab${gran === t.id ? ' aac-tab--active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="aac-svg" role="img" aria-label="Aktivitätsdiagramm">
        {/* Gridlines + y labels */}
        {yTicks.map(f => {
          const y = PT + chartH * (1 - f)
          return (
            <g key={f}>
              <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="currentColor" strokeOpacity={f === 0 ? 0.18 : 0.07} />
              <text x={PL - 5} y={y + 3.5} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.4}>
                {Math.round(maxVal * f)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {buckets.map((b, i) => {
          const cx = PL + i * groupW + groupW / 2
          const tH = (b.tips / maxVal) * chartH
          const lH = (b.logins / maxVal) * chartH
          return (
            <g key={b.key}>
              <rect x={cx - barW - 1} y={PT + chartH - tH} width={barW} height={tH} rx={2.5} fill="#6366f1">
                <title>{`${b.label}: ${b.tips} Tipps`}</title>
              </rect>
              <rect x={cx + 1} y={PT + chartH - lH} width={barW} height={lH} rx={2.5} fill="#10b981">
                <title>{`${b.label}: ${b.logins} Logins`}</title>
              </rect>
              <text x={cx} y={H - 16} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.55}>{b.label}</text>
              {b.sub && <text x={cx} y={H - 5} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.32}>{b.sub}</text>}
            </g>
          )
        })}
      </svg>

      <div className="stats-chart-legend">
        <span className="stats-legend-dot" style={{ background: '#6366f1' }} />
        <span>Tipps</span>
        <span className="stats-legend-dot" style={{ background: '#10b981', marginLeft: 12 }} />
        <span>Logins</span>
      </div>
    </div>
  )
}
