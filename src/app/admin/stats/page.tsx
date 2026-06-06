import { getDb, queryAll } from '@/lib/db'
import { BarChart2, TrendingUp, Target } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Statistiken' }

interface DayCount { day: string; count: number }
interface MatchPredStat {
  match_id: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  match_time: string
  pred_home: number
  pred_away: number
  count: number
}

export default async function AdminStatsPage() {
  const db = getDb()

  const [tipsPerDay, loginsPerDay, predStats] = await Promise.all([
    queryAll<DayCount>(db, `
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM predictions
      WHERE created_at >= datetime('now', '-14 days')
      GROUP BY day ORDER BY day ASC
    `),
    queryAll<DayCount>(db, `
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM audit_logs
      WHERE action = 'user.login' AND created_at >= datetime('now', '-14 days')
      GROUP BY day ORDER BY day ASC
    `),
    queryAll<MatchPredStat>(db, `
      SELECT m.id AS match_id, m.home_team, m.away_team,
        m.home_score, m.away_score, m.match_time,
        p.home_score AS pred_home, p.away_score AS pred_away,
        COUNT(*) AS count
      FROM matches m
      JOIN predictions p ON p.match_id = m.id
      WHERE m.status = 'finished'
      GROUP BY m.id, p.home_score, p.away_score
      ORDER BY m.match_time DESC, count DESC
    `),
  ])

  const totalTips = tipsPerDay.reduce((s, d) => s + d.count, 0)
  const totalLogins = loginsPerDay.reduce((s, d) => s + d.count, 0)

  // Group pred stats by match
  const matchMap = new Map<string, { home_team: string; away_team: string; home_score: number | null; away_score: number | null; match_time: string; preds: MatchPredStat[] }>()
  for (const row of predStats) {
    if (!matchMap.has(row.match_id)) {
      matchMap.set(row.match_id, {
        home_team: row.home_team, away_team: row.away_team,
        home_score: row.home_score, away_score: row.away_score,
        match_time: row.match_time, preds: [],
      })
    }
    matchMap.get(row.match_id)!.preds.push(row)
  }
  const matches = Array.from(matchMap.values())

  return (
    <div className="admin-page space-y-8 animate-fade-in">
      <AdminPageHeader title="Statistiken" description="Aktivität und Tipp-Verteilung der letzten 14 Tage" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipps (14 Tage)</span>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{totalTips}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Logins (14 Tage)</span>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{totalLogins}</p>
        </div>
        <div className="card p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ausgewertete Spiele</span>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{matches.length}</p>
        </div>
      </div>

      {/* Activity chart */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Aktivität – letzte 14 Tage
        </h2>
        <ActivityChart tipsData={tipsPerDay} loginsData={loginsPerDay} />
        <div className="flex items-center gap-5 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
            Tipps abgegeben
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            Logins
          </span>
        </div>
      </div>

      {/* Per-match prediction breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Tipp-Verteilung pro Spiel
        </h2>
        {matches.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">
            Noch keine abgeschlossenen Spiele mit Tipps.
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(({ home_team, away_team, home_score, away_score, match_time, preds }) => {
              const total = preds.reduce((s, p) => s + p.count, 0)
              const top = preds.slice(0, 8)
              const rest = total - top.reduce((s, p) => s + p.count, 0)
              const date = new Date(match_time + (match_time.includes('T') ? '' : 'T12:00:00'))
              const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
              return (
                <div key={`${home_team}-${away_team}-${match_time}`} className="card p-4">
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {home_team} – {away_team}
                      </span>
                      <span className="ml-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {home_score}:{away_score}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{dateStr} · {total} Tipps</span>
                  </div>
                  <div className="space-y-1.5">
                    {top.map((p) => {
                      const pct = Math.round((p.count / total) * 100)
                      const isCorrect = p.pred_home === home_score && p.pred_away === away_score
                      return (
                        <div key={`${p.pred_home}:${p.pred_away}`} className="flex items-center gap-2">
                          <span className={`text-xs font-mono w-9 shrink-0 font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {p.pred_home}:{p.pred_away}
                          </span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isCorrect ? 'bg-emerald-500' : 'bg-indigo-400 dark:bg-indigo-500'}`}
                              style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-20 text-right shrink-0">
                            {p.count}× ({pct}%)
                          </span>
                        </div>
                      )
                    })}
                    {rest > 0 && (
                      <p className="text-xs text-slate-400 pt-1">+ {rest} weitere Tipps (seltener)</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityChart({ tipsData, loginsData }: { tipsData: DayCount[]; loginsData: DayCount[] }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 13 + i)
    return d.toISOString().slice(0, 10)
  })

  const tipsMap = Object.fromEntries(tipsData.map(d => [d.day, d.count]))
  const loginsMap = Object.fromEntries(loginsData.map(d => [d.day, d.count]))

  const tips = days.map(d => tipsMap[d] ?? 0)
  const logins = days.map(d => loginsMap[d] ?? 0)
  const maxVal = Math.max(...tips, ...logins, 1)

  const W = 560
  const H = 140
  const PL = 28, PR = 8, PT = 8, PB = 28
  const chartW = W - PL - PR
  const chartH = H - PT - PB
  const groupW = chartW / 14
  const barW = groupW * 0.33

  const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const yTicks = [0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-slate-900 dark:text-white" style={{ height: 140 }} aria-hidden="true">
      {/* Y gridlines */}
      {yTicks.map(frac => {
        const y = PT + chartH * (1 - frac)
        const val = Math.round(maxVal * frac)
        return (
          <g key={frac}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
            <text x={PL - 4} y={y + 3.5} textAnchor="end" fontSize={8} fill="currentColor" opacity={0.35}>{val}</text>
          </g>
        )
      })}
      {/* Baseline */}
      <line x1={PL} x2={W - PR} y1={PT + chartH} y2={PT + chartH} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />

      {/* Bars + labels */}
      {days.map((day, i) => {
        const cx = PL + i * groupW + groupW / 2
        const tH = ((tips[i] ?? 0) / maxVal) * chartH
        const lH = ((logins[i] ?? 0) / maxVal) * chartH
        const dateObj = new Date(day + 'T12:00:00Z')
        const label = `${dateObj.getUTCDate()}. ${DAY_NAMES[dateObj.getUTCDay()]}`

        return (
          <g key={day}>
            <rect x={cx - barW - 1} y={PT + chartH - tH} width={barW} height={tH} rx={2} fill="#6366f1" opacity={0.85} />
            <rect x={cx + 1} y={PT + chartH - lH} width={barW} height={lH} rx={2} fill="#10b981" opacity={0.85} />
            <text x={cx} y={H - 5} textAnchor="middle" fontSize={7.5} fill="currentColor" opacity={0.4}>{label}</text>
          </g>
        )
      })}
    </svg>
  )
}
