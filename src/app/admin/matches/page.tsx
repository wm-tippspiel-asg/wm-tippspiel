import { getDb, queryAll } from '@/lib/db'
import { AdminMatchesClient } from '@/components/admin/AdminMatchesClient'
import type { Match } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Spielverwaltung' }

export default async function AdminMatchesPage() {
  const db = getDb()
  const matches = await queryAll<Match>(
    db,
    'SELECT * FROM matches ORDER BY match_time ASC',
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Spielverwaltung</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {matches.length} Spiele eingetragen
        </p>
      </div>
      <AdminMatchesClient initialMatches={matches} />
    </div>
  )
}
