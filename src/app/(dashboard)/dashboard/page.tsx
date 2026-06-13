import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne } from '@/lib/db'
import { getCached, setCached, CACHE_KEYS } from '@/lib/cache'
import { MatchCard } from '@/components/dashboard/MatchCard'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { DashboardCountdown } from '@/components/dashboard/DashboardCountdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar } from 'lucide-react'
import type { Match, Prediction, LeaderboardEntry, GroupStanding } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  // Live matches — never cache
  const liveMatches = await queryAll<Match>(db,
    `SELECT * FROM matches WHERE status = 'live' ORDER BY match_time ASC`)

  // Cached: upcoming matches (30s) and leaderboard top 5 (60s)
  let upcomingMatches = await getCached<Match[]>(CACHE_KEYS.MATCHES_UPCOMING)
  if (!upcomingMatches) {
    upcomingMatches = await queryAll<Match>(db,
      `SELECT * FROM matches WHERE status IN ('scheduled','locked') AND match_time > datetime('now')
       ORDER BY match_time ASC LIMIT 5`)
    await setCached(CACHE_KEYS.MATCHES_UPCOMING, upcomingMatches, 300)
  }

  let leaderboard = await getCached<LeaderboardEntry[]>('cache:leaderboard:top5')
  if (!leaderboard) {
    leaderboard = await queryAll<LeaderboardEntry>(db,
      `SELECT u.id AS user_id, u.username,
              COALESCE(l.total_points,   0) AS total_points,
              COALESCE(l.exact_results,  0) AS exact_results,
              COALESCE(l.correct_diff,   0) AS correct_diff,
              COALESCE(l.correct_winner, 0) AS correct_winner,
              COALESCE(l.total_tips,     0) AS total_tips,
              l.rank
       FROM users u
       LEFT JOIN leaderboard l ON l.user_id = u.id
       WHERE u.role = 'user' AND u.is_banned = 0
       ORDER BY total_points DESC, exact_results DESC, u.username ASC
       LIMIT 5`)
    await setCached('cache:leaderboard:top5', leaderboard)
  }

  // User-specific: never cache
  const [predictions, stats, userRank] = await Promise.all([
    queryAll<Prediction>(db, `SELECT * FROM predictions WHERE user_id = ?`, [user.id]),
    queryOne<{ total_tips: number; total_points: number; exact_results: number }>(db,
      `SELECT COUNT(*) AS total_tips,
              COALESCE(SUM(points),0) AS total_points,
              COUNT(CASE WHEN points=(SELECT value FROM scoring_config WHERE key='exact_result') THEN 1 END) AS exact_results
       FROM predictions WHERE user_id = ?`, [user.id]),
    queryOne<{ rank: number }>(db,
      `SELECT COUNT(*) + 1 AS rank
       FROM users u2
       LEFT JOIN leaderboard l2 ON l2.user_id = u2.id
       WHERE u2.role = 'user' AND u2.is_banned = 0
         AND (
           COALESCE(l2.total_points, 0) > COALESCE((SELECT total_points FROM leaderboard WHERE user_id = ?1), 0)
           OR (COALESCE(l2.total_points, 0) = COALESCE((SELECT total_points FROM leaderboard WHERE user_id = ?1), 0)
               AND COALESCE(l2.exact_results, 0) > COALESCE((SELECT exact_results FROM leaderboard WHERE user_id = ?1), 0))
           OR (COALESCE(l2.total_points, 0) = COALESCE((SELECT total_points FROM leaderboard WHERE user_id = ?1), 0)
               AND COALESCE(l2.exact_results, 0) = COALESCE((SELECT exact_results FROM leaderboard WHERE user_id = ?1), 0)
               AND u2.username < (SELECT username FROM users WHERE id = ?1))
         )`, [user.id]),
  ])

  const [totalParticipants, groupStandings] = await Promise.all([
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM leaderboard`),
    // Klassenwertung = persönliche Punkte der Mitglieder, fair als Ø pro
    // Mitglied gewertet (größenunabhängig) — konsistent mit /api/leaderboard.
    queryAll<GroupStanding>(db,
      `WITH group_stats AS (
         SELECT ug.id, ug.name, ug.description,
                COUNT(DISTINCT u.id) AS member_count,
                COALESCE(SUM(l.total_points), 0) AS total_points,
                COALESCE(SUM(l.exact_results), 0) AS exact_results,
                CASE WHEN COUNT(DISTINCT u.id) > 0
                     THEN CAST(COALESCE(SUM(l.total_points), 0) AS REAL) / COUNT(DISTINCT u.id)
                     ELSE 0 END AS avg_points_raw,
                CASE WHEN COUNT(DISTINCT u.id) > 0
                     THEN CAST(COALESCE(SUM(l.exact_results), 0) AS REAL) / COUNT(DISTINCT u.id)
                     ELSE 0 END AS avg_exact_raw,
                CASE WHEN COUNT(DISTINCT u.id) > 0
                     THEN ROUND(CAST(COALESCE(SUM(l.total_points), 0) AS REAL) / COUNT(DISTINCT u.id), 1)
                     ELSE 0 END AS avg_points
         FROM user_groups ug
         LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
         LEFT JOIN users u ON u.id = ugm.user_id AND u.role = 'user' AND u.is_banned = 0
         LEFT JOIN leaderboard l ON l.user_id = u.id
         GROUP BY ug.id
       )
       SELECT id, name, description, member_count, total_points, exact_results, avg_points, avg_points_raw, avg_exact_raw
       FROM group_stats
       ORDER BY avg_points_raw DESC, avg_exact_raw DESC, name ASC
       LIMIT 5`),
  ])
  const predMap = new Map(predictions.map((p) => [p.match_id, p]))

  const specialBets = await queryAll<{ bet_type: string }>(
    db, `SELECT bet_type FROM special_bets WHERE user_id = ?`, [user.id]
  )
  const hasWinner = specialBets.some(b => b.bet_type === 'winner')
  const hasTopScorer = specialBets.some(b => b.bet_type === 'top_scorer')

  return (
    <div className="wm-fade-in" style={{ display: 'grid', gap: 28 }}>

      {/* Hero */}
      <div className="wm-card wm-hero">
        <div className="wm-hero-pattern" />
        <div className="wm-hero-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase', opacity: .9, marginBottom: 14 }}>
            FIFA Weltmeisterschaft 2026
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end',
            justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>
                Moin, {user.username} 👋
              </h1>
              <p style={{ margin: '10px 0 0', fontSize: 15, fontWeight: 600, opacity: .92, maxWidth: 460 }}>
                {upcomingMatches.length > 0
                  ? `${upcomingMatches.length} Spiele warten auf deinen Tipp.`
                  : 'Alle Tipps abgegeben — viel Glück! 🍀'}
              </p>
            </div>
            <Link href="/predictions"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                background: 'var(--surface)', color: 'var(--accent-strong)', borderRadius: 11,
                fontWeight: 700, fontSize: 14.5, textDecoration: 'none' }}>
              Jetzt tippen →
            </Link>
          </div>
        </div>
      </div>

      {/* Live-Spiele */}
      {liveMatches.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="wm-dot wm-dot-live" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>
              Jetzt Live
            </span>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
              {liveMatches.length} Spiel{liveMatches.length !== 1 ? 'e' : ''}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} prediction={predMap.get(m.id)} showPredictionForm={false} />
            ))}
          </div>
        </div>
      )}

      {/* Countdown + Special Bets CTA */}
      <DashboardCountdown hasWinner={hasWinner} hasTopScorer={hasTopScorer} />

      {/* Stats */}
      <div className="dashboard-stats-grid">
        <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
          <div className="wm-stat" style={{ cursor: 'pointer' }}>
            <div className="k">Dein Rang</div>
            <div className="v" style={{ fontSize: 28 }}>{userRank ? `${userRank.rank}.` : '–'}</div>
            <div className="sub">von {totalParticipants?.count ?? 0} Teilnehmern</div>
          </div>
        </Link>
        <div className="wm-stat">
          <div className="k">Punkte</div>
          <div className="v" style={{ fontSize: 28 }}>{stats?.total_points ?? 0}</div>
          <div className="sub">Gesamtpunkte</div>
        </div>
        <div className="wm-stat">
          <div className="k">Exakte Tipps</div>
          <div className="v" style={{ fontSize: 28 }}>{stats?.exact_results ?? 0}</div>
          <div className="sub">à 5 Punkte</div>
        </div>
        <div className="wm-stat">
          <div className="k">Tipps gesamt</div>
          <div className="v" style={{ fontSize: 28 }}>{stats?.total_tips ?? 0}</div>
          <div className="sub">abgegeben</div>
        </div>
      </div>

      <div className="dashboard-main-grid">

        {/* Upcoming matches */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="wm-eyebrow">Als Nächstes</div>
              <h2 className="wm-section-h2" style={{ fontFamily: 'var(--font-display)', marginTop: 4 }}>Nächste Spiele</h2>
            </div>
            <Link href="/predictions" className="wm-btn wm-btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}>
              Alle ansehen →
            </Link>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="wm-card">
              <EmptyState icon={Calendar} title="Keine anstehenden Spiele"
                description="Alle Spiele wurden gespielt oder noch keine eingetragen." />
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {upcomingMatches.map((m) => (
                <MatchCard key={m.id} match={m} prediction={predMap.get(m.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Ranglisten */}
        <div style={{ display: 'grid', gap: 24 }}>

          {/* Top 5 Spieler */}
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <h2 className="wm-section-h2" style={{ fontFamily: 'var(--font-display)' }}>Top 5 Spieler</h2>
              <Link href="/leaderboard" className="wm-btn wm-btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}>
                Alle →
              </Link>
            </div>
            <div className="wm-card">
              <LeaderboardTable entries={leaderboard} currentUserId={user.id} />
            </div>
          </div>

          {/* Top 5 Gruppen (nur wenn Gruppen existieren) */}
          {groupStandings.length > 0 && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                <h2 className="wm-section-h2" style={{ fontFamily: 'var(--font-display)' }}>Top 5 Gruppen</h2>
                <Link href="/leaderboard" className="wm-btn wm-btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}>
                  Alle →
                </Link>
              </div>
              <div className="wm-card" style={{ overflow: 'hidden' }}>
                {groupStandings.map((g, i) => {
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div key={g.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 20px',
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                        {i < 3
                          ? <span style={{ fontSize: 20 }}>{medals[i]}</span>
                          : <span style={{ fontSize: 14, color: 'var(--muted)' }}>{i + 1}</span>}
                      </div>
                      <span style={{ width: 9, height: 9, borderRadius: 99, flexShrink: 0,
                        background: i === 0 ? 'var(--gold)' : i === 1 ? 'var(--silver)' : i === 2 ? 'var(--bronze)' : 'var(--surface-3)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{g.name}</span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}>
                          {g.member_count} Mitglied{g.member_count !== 1 ? 'er' : ''}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
                        width: 66, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                        color: i === 0 ? 'var(--good)' : 'var(--ink)' }}>
                        Ø {g.avg_points}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
