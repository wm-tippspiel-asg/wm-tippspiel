import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne } from '@/lib/db'
import { MatchCard } from '@/components/dashboard/MatchCard'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Trophy, Target, Zap, Star, Calendar } from 'lucide-react'
import type { Match, Prediction, LeaderboardEntry } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  // Next 5 upcoming matches
  const upcomingMatches = await queryAll<Match>(
    db,
    `SELECT * FROM matches
     WHERE status IN ('scheduled', 'locked')
     AND match_time > datetime('now')
     ORDER BY match_time ASC
     LIMIT 5`,
  )

  // User's predictions for upcoming matches
  const matchIds = upcomingMatches.map((m) => m.id)
  let predictions: Prediction[] = []
  if (matchIds.length > 0) {
    predictions = await queryAll<Prediction>(
      db,
      `SELECT * FROM predictions WHERE user_id = ? AND match_id IN (${matchIds.map(() => '?').join(',')})`,
      [user.id, ...matchIds],
    )
  }

  const predMap = new Map(predictions.map((p) => [p.match_id, p]))

  // Leaderboard top 10
  const leaderboard = await queryAll<LeaderboardEntry>(
    db,
    'SELECT * FROM leaderboard ORDER BY total_points DESC, exact_results DESC LIMIT 10',
  )

  // User stats
  const stats = await queryOne<{
    total_tips: number
    total_points: number
    exact_results: number
    correct_winner: number
  }>(
    db,
    `SELECT
      COUNT(*) AS total_tips,
      COALESCE(SUM(points), 0) AS total_points,
      COUNT(CASE WHEN points = (SELECT value FROM scoring_config WHERE key = 'exact_result') THEN 1 END) AS exact_results,
      COUNT(CASE WHEN points = (SELECT value FROM scoring_config WHERE key = 'correct_winner') THEN 1 END) AS correct_winner
    FROM predictions WHERE user_id = ?`,
    [user.id],
  )

  const userRank = await queryOne<{ rank: number | null }>(
    db,
    'SELECT rank FROM leaderboard WHERE user_id = ?',
    [user.id],
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div>
        <h1 className="page-title mb-4">Hallo, {user.username} 👋</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            label="Gesamtpunkte"
            value={stats?.total_points ?? 0}
            icon={Trophy}
            highlight
          />
          <StatsCard
            label="Mein Rang"
            value={userRank?.rank ? `#${userRank.rank}` : '–'}
            icon={Star}
          />
          <StatsCard
            label="Exakte Treffer"
            value={stats?.exact_results ?? 0}
            icon={Zap}
            description="+5 Punkte"
          />
          <StatsCard
            label="Tipps abgegeben"
            value={stats?.total_tips ?? 0}
            icon={Target}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Upcoming matches */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Nächste Spiele</h2>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Calendar}
                title="Keine kommenden Spiele"
                description="Alle Spiele wurden bereits gespielt oder es wurden noch keine eingetragen."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="section-title">Rangliste</h2>
          <div className="card">
            <LeaderboardTable entries={leaderboard} currentUserId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
