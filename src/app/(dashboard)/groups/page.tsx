import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { GroupStandingsServer } from '@/components/dashboard/GroupStandingsServer'
import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Gruppen' }

export default async function GroupsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="wm-fade-in" style={{ display: 'grid', gap: 24 }}>
      <div>
        <div className="wm-eyebrow">Gruppenphase</div>
        <h1 className="wm-page-title" style={{ fontFamily: 'var(--font-display)', marginTop: 6 }}>
          <Trophy style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px' }} size={28} />
          Aktuelle Tabellen
        </h1>
        <p style={{ marginTop: 10, fontSize: 15, color: 'var(--muted)', maxWidth: 600 }}>
          Live-Tabellen aus der FIFA Weltmeisterschaft 2026. Aktualisiert in Echtzeit.
        </p>
      </div>

      <GroupStandingsServer />
    </div>
  )
}
