import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne } from '@/lib/db'
import { MatchCard } from '@/components/dashboard/MatchCard'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar, Trophy } from 'lucide-react'
import type { Match, Prediction, LeaderboardEntry } from '@/types'
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
      `SELECT * FROM leaderboard ORDER BY total_points DESC, exact_results DESC LIMIT 5`),
    queryOne<{ total_tips: number; total_points: number; exact_results: number }>(db,
      `SELECT COUNT(*) AS total_tips,
              COALESCE(SUM(points),0) AS total_points,
              COUNT(CASE WHEN points=(SELECT value FROM scoring_config WHERE key='exact_result') THEN 1 END) AS exact_results
       FROM predictions WHERE user_id = ?`, [user.id]),
    queryOne<{ rank: number | null }>(db,
      `SELECT rank FROM leaderboard WHERE user_id = ?`, [user.id]),
  ])

  const totalParticipants = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM leaderboard`)
  const predMap = new Map(predictions.map((p) => [p.match_id, p]))

  const openTipped = predictions.filter((p) => {
    const m = upcomingMatches.find((m) => m.id === p.match_id)
    return !!m
  }).length

  return (
    <div className="wm-fade-in" style={{ display: 'grid', gap: 28 }}>

      {/* Hero */}
      <div className="wm-card wm-hero">
        <div className="wm-hero-pattern" />
        <div className="wm-hero-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase', opacity: .9, marginBottom: 14 }}>
            ⚽ FIFA Weltmeisterschaft 2026
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          {
            k: 'Dein Rang',
            v: userRank?.rank ? `${userRank.rank}.` : '–',
            sub: `von ${totalParticipants?.count ?? 0} Teilnehmern`,
            href: '/leaderboard',
          },
          { k: 'Punkte', v: stats?.total_points ?? 0, sub: 'Gesamtpunkte' },
          { k: 'Exakte Tipps', v: stats?.exact_results ?? 0, sub: 'à 5 Punkte' },
          { k: 'Tipps gesamt', v: stats?.total_tips ?? 0, sub: 'abgegeben' },
        ].map((s, i) => (
          <div key={i} className="wm-stat" style={s.href ? { cursor: 'pointer' } : {}}
            onClick={s.href ? () => (window.location.href = s.href!) : undefined}>
            <div className="k">{s.k}</div>
            <div className="v" style={{ fontSize: 28 }}>{s.v}</div>
            <div className="sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

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

        {/* Leaderboard */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="wm-eyebrow">Büro-Rangliste</div>
              <h2 className="wm-section-h2" style={{ fontFamily: 'var(--font-display)', marginTop: 4 }}>Top 5</h2>
            </div>
            <Link href="/leaderboard" className="wm-btn wm-btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}>
              Alle →
            </Link>
          </div>
          <div className="wm-card">
            <LeaderboardTable entries={leaderboard} currentUserId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
