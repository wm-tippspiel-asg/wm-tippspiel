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

// Liefert einen runden Achsen-Maximalwert und gleichmäßige, ganzzahlige Ticks,
// damit die Y-Achse keine doppelten/krummen Beschriftungen zeigt.
function niceAxis(rawMax: number): { axisMax: number; yTickVals: number[] } {
  const target = 4 // angestrebte Anzahl an Schritten
  const rough = rawMax / target
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / pow
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow
  const axisMax = Math.max(step * target, Math.ceil(rawMax / step) * step)
  const vals: number[] = []
  for (let v = 0; v <= axisMax + 1e-9; v += step) vals.push(Math.round(v))
  return { axisMax, yTickVals: vals }
}

export function AdminActivityChart({ tips, logins }: { tips: DayCount[]; logins: DayCount[] }) {
  const [gran, setGran] = useState<Gran>('day')

  const tipsMap = useMemo(() => new Map(tips.map(d => [d.day, d.count])), [tips])
  const loginsMap = useMemo(() => new Map(logins.map(d => [d.day, d.count])), [logins])
  const buckets = useMemo(() => buildBuckets(gran, tipsMap, loginsMap), [gran, tipsMap, loginsMap])

  const totalTips = buckets.reduce((s, b) => s + b.tips, 0)
  const totalLogins = buckets.reduce((s, b) => s + b.logins, 0)
  const rawMax = Math.max(...buckets.map(b => Math.max(b.tips, b.logins)), 1)

  // "Schöner" Achsen-Maximalwert mit ganzzahligen, eindeutigen Ticks
  const { axisMax, yTickVals } = niceAxis(rawMax)
  const maxVal = axisMax

  // SVG-Geometrie
  const n = buckets.length
  const W = 640, H = 240
  const PL = 42, PR = 10, PT = 14, PB = 46
  const chartW = W - PL - PR, chartH = H - PT - PB
  const groupW = chartW / n
  const barW = Math.min(groupW * 0.34, 16)

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
        <defs>
          <linearGradient id="aac-grad-tips" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="aac-grad-logins" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Gridlines + y labels */}
        {yTickVals.map(v => {
          const y = PT + chartH * (1 - v / maxVal)
          const isBase = v === 0
          return (
            <g key={v}>
              <line
                x1={PL} x2={W - PR} y1={y} y2={y}
                stroke="currentColor" strokeOpacity={isBase ? 0.22 : 0.08}
                strokeWidth={isBase ? 1.25 : 1}
              />
              <text
                x={PL - 8} y={y + 4} textAnchor="end"
                className="aac-axis-label" style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {v}
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
              {b.tips > 0 && (
                <rect x={cx - barW - 1.5} y={PT + chartH - tH} width={barW} height={tH} rx={3} fill="url(#aac-grad-tips)">
                  <title>{`${b.label}: ${b.tips} Tipps`}</title>
                </rect>
              )}
              {b.logins > 0 && (
                <rect x={cx + 1.5} y={PT + chartH - lH} width={barW} height={lH} rx={3} fill="url(#aac-grad-logins)">
                  <title>{`${b.label}: ${b.logins} Logins`}</title>
                </rect>
              )}
              <text x={cx} y={H - 20} textAnchor="middle" className="aac-x-label">{b.label}</text>
              {b.sub && <text x={cx} y={H - 7} textAnchor="middle" className="aac-x-sub">{b.sub}</text>}
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
