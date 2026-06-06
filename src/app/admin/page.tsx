import { getDb, queryOne } from '@/lib/db'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecalculateAction } from '@/components/admin/RecalculateAction'
import { AutoUpdateAction } from '@/components/admin/AutoUpdateAction'
import { Users, Trophy, Key, FileText, RefreshCcw, Download, BarChart2 } from 'lucide-react'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Admin-Übersicht' }

export default async function AdminDashboard() {
  const db = getDb()

  const [userCount, matchCount, codeCount, logCount, participantCount] = await Promise.all([
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM users WHERE role = 'user'`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM matches`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM registration_codes WHERE is_active = 1`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM audit_logs`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM leaderboard`),
  ])

  const finishedMatches = await queryOne<{ count: number }>(
    db, `SELECT COUNT(*) AS count FROM matches WHERE status = 'finished'`
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Admin-Panel</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Übersicht und Verwaltung des WM-Tippspiels
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          label="Schüler"
          value={userCount?.count ?? 0}
          icon={Users}
          description="Registrierte Nutzer"
        />
        <StatsCard
          label="Spiele"
          value={`${finishedMatches?.count ?? 0}/${matchCount?.count ?? 0}`}
          icon={Trophy}
          description="Beendet / Gesamt"
        />
        <StatsCard
          label="Aktive Codes"
          value={codeCount?.count ?? 0}
          icon={Key}
          description="Verfügbare Zugangscodes"
        />
        <StatsCard
          label="Audit-Logs"
          value={logCount?.count ?? 0}
          icon={FileText}
          description="Protokollierte Aktionen"
        />
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/admin/users', icon: Users, title: 'Nutzerverwaltung', desc: 'Nutzer anzeigen, sperren oder löschen' },
          { href: '/admin/matches', icon: Trophy, title: 'Spielverwaltung', desc: 'Spiele anlegen und Ergebnisse eintragen' },
          { href: '/admin/codes', icon: Key, title: 'Zugangscodes', desc: 'Registrierungscodes generieren und verwalten' },
          { href: '/admin/logs', icon: FileText, title: 'Audit-Logs', desc: 'Sicherheitsrelevante Ereignisse einsehen' },
          { href: '/admin/stats', icon: BarChart2, title: 'Statistiken', desc: 'Aktivitäts-Chart und Tipp-Verteilung' },
        ].map(({ href, icon: Icon, title, desc }) => (
          <a
            key={href}
            href={href}
            className="card hover:shadow-card-hover transition-all p-5 group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/60 transition-colors">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          </a>
        ))}

        {/* Ergebnisse von API holen */}
        <AutoUpdateButton finishedCount={finishedMatches?.count ?? 0} />

        {/* Rangliste neu berechnen */}
        <RecalculateButton participantCount={participantCount?.count ?? 0} />
      </div>
    </div>
  )
}

function AutoUpdateButton({ finishedCount }: { finishedCount: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/40">
          <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Ergebnisse aktualisieren</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {finishedCount} Spiele bereits abgeschlossen
          </p>
          <AutoUpdateAction />
        </div>
      </div>
    </div>
  )
}

function RecalculateButton({ participantCount }: { participantCount: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40">
          <RefreshCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Rangliste</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {participantCount} Teilnehmer aktuell
          </p>
          <RecalculateAction />
        </div>
      </div>
    </div>
  )
}

