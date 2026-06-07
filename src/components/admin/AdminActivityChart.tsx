'use client'

import { useMemo, useState } from 'react'

interface DayCount { day: string; count: number }
type Gran = 'day' | 'week' | 'month'

interface Bucket { key: string; label: string; sub?: string; value: number }

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function ymd(d: Date): string { return d.toISOString().slice(0, 10) }

function weekStart(d: Date): Date {
  const r = new Date(d)
  const dow = (r.getUTCDay() + 6) % 7
  r.setUTCDate(r.getUTCDate() - dow)
  r.setUTCHours(0, 0, 0, 0)
  return r
}

function buildBuckets(gran: Gran, dataMap: Map<string, number>): Bucket[] {
  const now = new Date()
  const out: Bucket[] = []

  if (gran === 'day') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setUTCDate(d.getUTCDate() - i)
      const key = ymd(d)
      out.push({ key, label: `${d.getUTCDate()}.${d.getUTCMonth() + 1}`, sub: DAYS[d.getUTCDay()], value: dataMap.get(key) ?? 0 })
    }
  } else if (gran === 'week') {
    const thisWeek = weekStart(now)
    for (let i = 11; i >= 0; i--) {
      const ws = new Date(thisWeek); ws.setUTCDate(ws.getUTCDate() - i * 7)
      let value = 0
      for (let dd = 0; dd < 7; dd++) {
        const d = new Date(ws); d.setUTCDate(d.getUTCDate() + dd)
        value += dataMap.get(ymd(d)) ?? 0
      }
      out.push({ key: ymd(ws), label: `${ws.getUTCDate()}.${ws.getUTCMonth() + 1}`, sub: 'KW', value })
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      const prefix = `${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, '0')}`
      let value = 0
      for (const [k, v] of dataMap) if (k.startsWith(prefix)) value += v
      out.push({ key: prefix, label: MONTHS[m.getUTCMonth()] ?? '', sub: `${m.getUTCFullYear()}`.slice(2), value })
    }
  }
  return out
}

function niceAxis(rawMax: number): { axisMax: number; yTickVals: number[] } {
  const target = 4
  const rough = rawMax / target
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / pow
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow
  const axisMax = Math.max(step * target, Math.ceil(rawMax / step) * step)
  const vals: number[] = []
  for (let v = 0; v <= axisMax + 1e-9; v += step) vals.push(Math.round(v))
  return { axisMax, yTickVals: vals }
}

interface Props {
  data: DayCount[]
  label: string
  color: string
  colorLight: string
  gradientId: string
}

export function AdminActivityChart({ data, label, color, colorLight, gradientId }: Props) {
  const [gran, setGran] = useState<Gran>('day')

  const dataMap = useMemo(() => new Map(data.map(d => [d.day, d.count])), [data])
  const buckets = useMemo(() => buildBuckets(gran, dataMap), [gran, dataMap])

  const total = buckets.reduce((s, b) => s + b.value, 0)
  const rawMax = Math.max(...buckets.map(b => b.value), 1)
  const { axisMax, yTickVals } = niceAxis(rawMax)

  const n = buckets.length
  const W = 640, H = 240
  const PL = 42, PR = 10, PT = 14, PB = 46
  const chartW = W - PL - PR, chartH = H - PT - PB
  const groupW = chartW / n
  const barW = Math.min(groupW * 0.55, 22)

  const tabs: { id: Gran; label: string }[] = [
    { id: 'day', label: 'Pro Tag' },
    { id: 'week', label: 'Pro Woche' },
    { id: 'month', label: 'Pro Monat' },
  ]

  return (
    <div className="stats-chart-card">
      <div className="aac-head">
        <div className="aac-summary">
          <span><strong style={{ color }}>{total}</strong> {label}</span>
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

      <svg viewBox={`0 0 ${W} ${H}`} className="aac-svg" role="img" aria-label={`${label}-Diagramm`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorLight} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {yTickVals.map(v => {
          const y = PT + chartH * (1 - v / axisMax)
          const isBase = v === 0
          return (
            <g key={v}>
              <line x1={PL} x2={W - PR} y1={y} y2={y}
                stroke="currentColor" strokeOpacity={isBase ? 0.22 : 0.08}
                strokeWidth={isBase ? 1.25 : 1} />
              <text x={PL - 8} y={y + 4} textAnchor="end"
                className="aac-axis-label" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {v}
              </text>
            </g>
          )
        })}

        {buckets.map((b, i) => {
          const cx = PL + i * groupW + groupW / 2
          const bH = (b.value / axisMax) * chartH
          return (
            <g key={b.key}>
              {b.value > 0 && (
                <rect x={cx - barW / 2} y={PT + chartH - bH} width={barW} height={bH} rx={3} fill={`url(#${gradientId})`}>
                  <title>{`${b.label}: ${b.value} ${label}`}</title>
                </rect>
              )}
              <text x={cx} y={H - 20} textAnchor="middle" className="aac-x-label">{b.label}</text>
              {b.sub && <text x={cx} y={H - 7} textAnchor="middle" className="aac-x-sub">{b.sub}</text>}
            </g>
          )
        })}
      </svg>

      <div className="stats-chart-legend">
        <span className="stats-legend-dot" style={{ background: color }} />
        <span>{label}</span>
      </div>
    </div>
  )
}
