import { getDb, queryAll } from '@/lib/db'
import { AdminMatchesClient } from '@/components/admin/AdminMatchesClient'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { Match } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Spielverwaltung' }

export default async function AdminMatchesPage() {
  const db = getDb()
  const matches = await queryAll<Match>(db, 'SELECT * FROM matches ORDER BY match_time ASC')
  const finished = matches.filter(m => m.status === 'finished').length
  const live = matches.filter(m => m.status === 'live').length

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Spielverwaltung"
        description={`${matches.length} Spiele · ${finished} beendet${live > 0 ? ` · ${live} live` : ''}`}
      />
      <AdminMatchesClient initialMatches={matches} />
    </div>
  )
}
