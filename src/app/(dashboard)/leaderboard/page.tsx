import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne } from '@/lib/db'
import { LeaderboardTable } from '@/components/dashboard/LeaderboardTable'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Trophy, Medal, Target } from 'lucide-react'
import type { LeaderboardEntry } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Rangliste' }

export default async function LeaderboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  const entries = await queryAll<LeaderboardEntry>(
    db,
    'SELECT * FROM leaderboard ORDER BY total_points DESC, exact_results DESC, username ASC',
  )

  const myEntry = await queryOne<LeaderboardEntry>(
    db,
    'SELECT * FROM leaderboard WHERE user_id = ?',
    [user.id],
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Rangliste</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {entries.length} Teilnehmer
        </p>
      </div>

      {/* My position */}
      {myEntry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCard label="Mein Rang" value={myEntry.rank ? `#${myEntry.rank}` : '–'} icon={Trophy} highlight />
          <StatsCard label="Punkte" value={myEntry.total_points} icon={Medal} />
          <StatsCard label="Exakte Treffer" value={myEntry.exact_results} icon={Target} description="+5 Pkt." />
          <StatsCard label="Tipps gesamt" value={myEntry.total_tips} icon={Target} />
        </div>
      )}

      {/* Full leaderboard */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="section-title">Gesamtrangliste</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Exakt=5 Pkt. · Differenz=3 Pkt. · Gewinner=2 Pkt.
          </p>
        </div>
        <LeaderboardTable entries={entries} currentUserId={user.id} />
      </div>
    </div>
  )
}
