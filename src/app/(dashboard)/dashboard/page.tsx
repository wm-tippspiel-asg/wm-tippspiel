import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne } from '@/lib/db'
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

  const [upcomingMatches, predictions, leaderboard, stats, userRank] = await Promise.all([
    queryAll<Match>(db,
      `SELECT * FROM matches WHERE status IN ('scheduled','locked') AND match_time > datetime('now')
       ORDER BY match_time ASC LIMIT 5`),
    queryAll<Prediction>(db, `SELECT * FROM predictions WHERE user_id = ?`, [user.id]),
    queryAll<LeaderboardEntry>(db,
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
       LIMIT 5`),
    queryOne<{ total_tips: number; total_points: number; exact_results: number }>(db,
      `SELECT COUNT(*) AS total_tips,
              COALESCE(SUM(points),0) AS total_points,
              COUNT(CASE WHEN points=(SELECT value FROM scoring_config WHERE key='exact_result') THEN 1 END) AS exact_results
       FROM predictions WHERE user_id = ?`, [user.id]),
    queryOne<{ rank: number | null }>(db,
      `SELECT rank FROM leaderboard WHERE user_id = ?`, [user.id]),
  ])

  const [totalParticipants, groupStandings] = await Promise.all([
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM leaderboard`),
    queryAll<GroupStanding>(db,
      `SELECT ug.id, ug.name, ug.description,
              COUNT(DISTINCT ugm.user_id)              AS member_count,
              COALESCE(SUM(gp.points), 0)              AS total_points,
              COALESCE(SUM(CASE WHEN gp.points IS NOT NULL AND gp.points > 0 THEN 1 ELSE 0 END), 0) AS exact_results,
              0 AS avg_points
       FROM user_groups ug
       LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
       LEFT JOIN group_predictions gp ON gp.user_id = ugm.user_id AND gp.group_id = ug.id
       GROUP BY ug.id
       ORDER BY total_points DESC, exact_results DESC, ug.name ASC
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

      {/* Countdown + Special Bets CTA */}
      <DashboardCountdown hasWinner={hasWinner} hasTopScorer={hasTopScorer} />

      {/* Stats */}
      <div className="dashboard-stats-grid">
        <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
          <div className="wm-stat" style={{ cursor: 'pointer' }}>
            <div className="k">Dein Rang</div>
            <div className="v" style={{ fontSize: 28 }}>{userRank?.rank ? `${userRank.rank}.` : '–'}</div>
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
                        width: 48, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                        color: i === 0 ? 'var(--good)' : 'var(--ink)' }}>
                        {g.total_points}
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
