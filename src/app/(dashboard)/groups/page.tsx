import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { GroupStandingsServer } from '@/components/dashboard/GroupStandingsServer'
import { TournamentBracketServer } from '@/components/dashboard/TournamentBracketServer'
import { LiveMatchesBanner } from '@/components/dashboard/LiveMatchesBanner'
import { GroupsTabButtons } from '@/components/dashboard/GroupsTabButtons'
import { Trophy, GitBranch } from 'lucide-react'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Ergebnisse' }

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function GroupsPage({ searchParams }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { view } = await searchParams
  const isKO = view === 'ko'

  return (
    <div className="wm-fade-in" style={{ display: 'grid', gap: 24 }}>
      <div>
        <div className="wm-eyebrow">{isKO ? 'KO-Phase' : 'Gruppenphase'}</div>
        <h1 className="wm-page-title" style={{ fontFamily: 'var(--font-display)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isKO
            ? <><GitBranch size={26} style={{ flexShrink: 0 }} /> Turnierbaum</>
            : <><Trophy size={26} style={{ flexShrink: 0 }} /> Aktuelle Tabellen</>
          }
        </h1>
        <p style={{ marginTop: 10, fontSize: 15, color: 'var(--muted)', maxWidth: 600 }}>
          {isKO
            ? 'KO-Phase der FIFA Weltmeisterschaft 2026. Teams werden nach Abschluss der Gruppenphase eingetragen.'
            : 'Live-Tabellen aus der FIFA Weltmeisterschaft 2026. Aktualisiert in Echtzeit.'}
        </p>
      </div>

      {/* Tab buttons */}
      <Suspense fallback={<div style={{ height: 42 }} />}>
        <GroupsTabButtons />
      </Suspense>

      <LiveMatchesBanner />

      {isKO ? (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Lade Turnierbaum…</div>}>
          <TournamentBracketServer />
        </Suspense>
      ) : (
        <GroupStandingsServer />
      )}
    </div>
  )
}
