import { getDb, queryAll, queryOne } from '@/lib/db'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Statistiken' }

interface DayCount { day: string; count: number }
interface MatchPredStat {
  match_id: string; home_team: string; away_team: string
  home_score: number | null; away_score: number | null
  match_time: string; pred_home: number; pred_away: number; count: number
}
interface TopUser { username: string; exact_results: number; total_tips: number; total_points: number }
interface HitDist {
  total: number; points: number
  exact: number; diff: number; tendency: number; miss: number
}

export default async function AdminStatsPage() {
  const db = getDb()

  const [
    tipsPerDay, loginsPerDay, predStats, topUsers,
    totalPreds, totalUsers, activeUsers, hitDist,
  ] = await Promise.all([
    queryAll<DayCount>(db, `
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM predictions WHERE created_at >= datetime('now', '-14 days')
      GROUP BY day ORDER BY day ASC`),
    queryAll<DayCount>(db, `
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM audit_logs WHERE action = 'user.login' AND created_at >= datetime('now', '-14 days')
      GROUP BY day ORDER BY day ASC`),
    queryAll<MatchPredStat>(db, `
      SELECT m.id AS match_id, m.home_team, m.away_team,
        m.home_score, m.away_score, m.match_time,
        p.home_score AS pred_home, p.away_score AS pred_away, COUNT(*) AS count
      FROM matches m JOIN predictions p ON p.match_id = m.id
      WHERE m.status = 'finished'
      GROUP BY m.id, p.home_score, p.away_score
      ORDER BY m.match_time DESC, count DESC`),
    queryAll<TopUser>(db, `
      SELECT u.username, l.exact_results, l.total_tips, l.total_points
      FROM leaderboard l JOIN users u ON u.id = l.user_id
      WHERE l.total_tips > 0
      ORDER BY l.exact_results DESC, l.total_points DESC
      LIMIT 8`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM predictions`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM users WHERE role = 'user'`),
    queryOne<{ count: number }>(db, `SELECT COUNT(DISTINCT user_id) AS count FROM predictions`),
    queryOne<HitDist>(db, `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(p.points), 0) AS points,
        SUM(CASE WHEN p.home_score = m.home_score AND p.away_score = m.away_score
              THEN 1 ELSE 0 END) AS exact,
        SUM(CASE WHEN NOT (p.home_score = m.home_score AND p.away_score = m.away_score)
              AND (p.home_score - p.away_score) = (m.home_score - m.away_score)
              THEN 1 ELSE 0 END) AS diff,
        SUM(CASE WHEN (p.home_score - p.away_score) <> (m.home_score - m.away_score)
              AND (
                (p.home_score > p.away_score AND m.home_score > m.away_score)
                OR (p.home_score < p.away_score AND m.home_score < m.away_score)
                OR (p.home_score = p.away_score AND m.home_score = m.away_score)
              ) THEN 1 ELSE 0 END) AS tendency,
        SUM(CASE WHEN NOT (
                (p.home_score > p.away_score AND m.home_score > m.away_score)
                OR (p.home_score < p.away_score AND m.home_score < m.away_score)
                OR (p.home_score = p.away_score AND m.home_score = m.away_score)
              ) THEN 1 ELSE 0 END) AS miss
      FROM predictions p JOIN matches m ON m.id = p.match_id
      WHERE m.status = 'finished' AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL`),
  ])

  const totalTips14 = tipsPerDay.reduce((s, d) => s + d.count, 0)
  const totalLogins14 = loginsPerDay.reduce((s, d) => s + d.count, 0)

  const matchMap = new Map<string, {
    home_team: string; away_team: string
    home_score: number | null; away_score: number | null
    match_time: string; preds: MatchPredStat[]
  }>()
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

  const userCount = totalUsers?.count ?? 0
  const active = activeUsers?.count ?? 0
  const partPct = userCount > 0 ? Math.round((active / userCount) * 100) : 0
  const avgTipsPerUser = active > 0
    ? Math.round((totalPreds?.count ?? 0) / active)
    : 0

  const hd = hitDist ?? { total: 0, points: 0, exact: 0, diff: 0, tendency: 0, miss: 0 }
  const avgPoints = hd.total > 0 ? (hd.points / hd.total).toFixed(1) : '0'
  const hitRate = hd.total > 0
    ? Math.round(((hd.exact + hd.diff + hd.tendency) / hd.total) * 100)
    : 0

  const distSegments = [
    { key: 'exact', label: 'Volltreffer', value: hd.exact, color: '#10b981' },
    { key: 'diff', label: 'Tordifferenz', value: hd.diff, color: '#6366f1' },
    { key: 'tendency', label: 'Tendenz', value: hd.tendency, color: '#f59e0b' },
    { key: 'miss', label: 'Daneben', value: hd.miss, color: '#94a3b8' },
  ]

  const kpis = [
    { val: `${active}`, sub: `von ${userCount} Schüler:innen`, label: 'Aktiv getippt', accent: '#6366f1', extra: `${partPct}%` },
    { val: `${totalPreds?.count ?? 0}`, label: 'Tipps gesamt', accent: '#8b5cf6' },
    { val: `${avgTipsPerUser}`, label: 'Ø Tipps / aktiv', accent: '#0ea5e9' },
    { val: `${matches.length}`, label: 'Ausgewertete Spiele', accent: '#f59e0b' },
    { val: avgPoints, label: 'Ø Punkte / Tipp', accent: '#10b981' },
    { val: `${hitRate}%`, label: 'Trefferquote', accent: '#ec4899' },
  ]

  return (
    <div className="admin-page">
      <AdminPageHeader title="Statistiken" description="Beteiligung, Aktivität und Tipp-Genauigkeit" />

      {/* KPI row */}
      <div className="stats-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="stats-kpi-card" style={{ borderTopColor: k.accent }}>
            <div className="stats-kpi-val" style={{ color: k.accent }}>
              {k.val}
              {k.extra && <span className="stats-kpi-extra">{k.extra}</span>}
            </div>
            <div className="stats-kpi-label">{k.label}</div>
            {k.sub && <div className="stats-kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Hit distribution — overall accuracy breakdown */}
      <div className="stats-section">
        <div className="stats-section-title">Treffer-Verteilung — alle ausgewerteten Tipps</div>
        <div className="stats-chart-card">
          {hd.total === 0 ? (
            <div className="stats-empty">Noch keine abgeschlossenen Spiele.</div>
          ) : (
            <>
              <div className="stats-dist-bar">
                {distSegments.map((s) => {
                  const pct = (s.value / hd.total) * 100
                  if (pct === 0) return null
                  return (
                    <div
                      key={s.key}
                      className="stats-dist-seg"
                      style={{ width: `${pct}%`, background: s.color }}
                      title={`${s.label}: ${s.value} (${Math.round(pct)}%)`}
                    >
                      {pct >= 7 && `${Math.round(pct)}%`}
                    </div>
                  )
                })}
              </div>
              <div className="stats-dist-legend">
                {distSegments.map((s) => {
                  const pct = hd.total > 0 ? Math.round((s.value / hd.total) * 100) : 0
                  return (
                    <div key={s.key} className="stats-dist-item">
                      <span className="stats-legend-dot" style={{ background: s.color }} />
                      <span className="stats-dist-item-label">{s.label}</span>
                      <span className="stats-dist-item-val">{s.value}<span className="stats-dist-item-pct"> · {pct}%</span></span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Activity chart */}
      <div className="stats-section">
        <div className="stats-section-title">Aktivität — letzte 14 Tage</div>
        <div className="stats-chart-card">
          <div className="stats-chart-head">
            <span><strong>{totalTips14}</strong> Tipps</span>
            <span><strong>{totalLogins14}</strong> Logins</span>
          </div>
          <ActivityChart tipsData={tipsPerDay} loginsData={loginsPerDay} />
          <div className="stats-chart-legend">
            <span className="stats-legend-dot" style={{ background: '#6366f1' }} />
            <span>Tipps</span>
            <span className="stats-legend-dot" style={{ background: '#10b981', marginLeft: 12 }} />
            <span>Logins</span>
          </div>
        </div>
      </div>

      <div className="stats-two-col">

        {/* Top users by accuracy */}
        <div className="stats-section">
          <div className="stats-section-title">Genauigkeits-Ranking</div>
          <div className="stats-list-card">
            {topUsers.length === 0 ? (
              <div className="stats-empty">Noch keine Daten</div>
            ) : topUsers.map((u, i) => {
              const pct = u.total_tips > 0 ? Math.round((u.exact_results / u.total_tips) * 100) : 0
              const medals = ['🥇', '🥈', '🥉']
              return (
                <div key={u.username} className="stats-user-row">
                  <div className="stats-user-rank">
                    {i < 3 ? medals[i] : <span className="stats-rank-num">{i + 1}</span>}
                  </div>
                  <div className="stats-user-info">
                    <div className="stats-user-name">{u.username}</div>
                    <div className="stats-user-sub">{u.exact_results} Volltreffer · {u.total_tips} Tipps · {u.total_points} Pkt</div>
                  </div>
                  <div className="stats-user-pct">
                    <div className="stats-pct-bar">
                      <div className="stats-pct-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="stats-pct-val">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Match prediction breakdown */}
        <div className="stats-section">
          <div className="stats-section-title">Tipp-Verteilung pro Spiel</div>
          {matches.length === 0 ? (
            <div className="stats-list-card"><div className="stats-empty">Noch keine abgeschlossenen Spiele.</div></div>
          ) : (
            <div className="stats-match-list">
              {matches.map(({ home_team, away_team, home_score, away_score, match_time, preds }) => {
                const total = preds.reduce((s, p) => s + p.count, 0)
                const top = preds.slice(0, 6)
                const rest = total - top.reduce((s, p) => s + p.count, 0)
                const date = new Date(match_time + (match_time.includes('T') ? '' : 'T12:00:00'))
                const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                return (
                  <div key={`${home_team}-${away_team}-${match_time}`} className="stats-match-card">
                    <div className="stats-match-header">
                      <div className="stats-match-teams">
                        <span className="stats-match-name">{home_team} – {away_team}</span>
                        <span className="stats-match-result">{home_score}:{away_score}</span>
                      </div>
                      <div className="stats-match-meta">{dateStr} · {total} Tipps</div>
                    </div>
                    <div className="stats-pred-list">
                      {top.map((p) => {
                        const pct = Math.round((p.count / total) * 100)
                        const isCorrect = p.pred_home === home_score && p.pred_away === away_score
                        return (
                          <div key={`${p.pred_home}:${p.pred_away}`} className="stats-pred-row">
                            <span className={`stats-pred-score${isCorrect ? ' stats-pred-score--correct' : ''}`}>
                              {p.pred_home}:{p.pred_away}
                            </span>
                            <div className="stats-pred-bar-wrap">
                              <div
                                className={`stats-pred-bar${isCorrect ? ' stats-pred-bar--correct' : ''}`}
                                style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                              />
                            </div>
                            <span className="stats-pred-meta">{p.count}× ({pct}%)</span>
                          </div>
                        )
                      })}
                      {rest > 0 && <div className="stats-pred-rest">+{rest} weitere</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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

  const W = 540; const H = 160
  const PL = 26; const PR = 6; const PT = 8; const PB = 26
  const chartW = W - PL - PR; const chartH = H - PT - PB
  const groupW = chartW / 14; const barW = groupW * 0.32
  const DAY = ['So','Mo','Di','Mi','Do','Fr','Sa']

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="stats-chart-svg" aria-hidden="true">
      {[0.25,0.5,0.75,1].map(f => {
        const y = PT + chartH * (1 - f)
        return (
          <g key={f}>
            <line x1={PL} x2={W-PR} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.07} strokeWidth={1}/>
            <text x={PL-3} y={y+3.5} textAnchor="end" fontSize={7.5} fill="currentColor" opacity={0.3}>{Math.round(maxVal*f)}</text>
          </g>
        )
      })}
      <line x1={PL} x2={W-PR} y1={PT+chartH} y2={PT+chartH} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1}/>
      {days.map((day, i) => {
        const cx = PL + i * groupW + groupW / 2
        const tH = ((tips[i] ?? 0) / maxVal) * chartH
        const lH = ((logins[i] ?? 0) / maxVal) * chartH
        const dateObj = new Date(day + 'T12:00:00Z')
        const label = `${dateObj.getUTCDate()}/${DAY[dateObj.getUTCDay()]}`
        return (
          <g key={day}>
            <rect x={cx-barW-1} y={PT+chartH-tH} width={barW} height={tH} rx={2} fill="#6366f1" opacity={0.85}/>
            <rect x={cx+1} y={PT+chartH-lH} width={barW} height={lH} rx={2} fill="#10b981" opacity={0.85}/>
            <text x={cx} y={H-4} textAnchor="middle" fontSize={7} fill="currentColor" opacity={0.35}>{label}</text>
          </g>
        )
      })}
    </svg>
  )
}
