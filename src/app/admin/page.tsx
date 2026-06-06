import { getDb, queryOne, queryAll } from '@/lib/db'
import { RecalculateAction } from '@/components/admin/RecalculateAction'
import { AutoUpdateAction } from '@/components/admin/AutoUpdateAction'
import { Users, Trophy, Key, FileText, Download, RefreshCcw } from 'lucide-react'
import type { AuditLog } from '@/types'
import type { Metadata } from 'next'
import { formatDateTime } from '@/lib/utils'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Admin-Übersicht' }

export default async function AdminDashboard() {
  const db = getDb()

  const [userCount, matchCount, codeCount, logCount, finishedMatches, recentLogs] = await Promise.all([
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM users WHERE role = 'user'`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM matches`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM registration_codes WHERE is_active = 1`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM audit_logs`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM matches WHERE status = 'finished'`),
    queryAll<AuditLog>(db, `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6`),
  ])

  const stats = [
    { label: 'Schüler', value: userCount?.count ?? 0, icon: Users, color: 'indigo' },
    { label: 'Spiele', value: `${finishedMatches?.count ?? 0} / ${matchCount?.count ?? 0}`, icon: Trophy, color: 'emerald', sub: 'beendet / gesamt' },
    { label: 'Aktive Codes', value: codeCount?.count ?? 0, icon: Key, color: 'amber' },
    { label: 'Audit-Logs', value: logCount?.count ?? 0, icon: FileText, color: 'slate' },
  ]

  const actionColor: Record<string, string> = {
    'user.created': '#10b981', 'user.login': '#6366f1', 'user.banned': '#ef4444',
    'user.deleted': '#ef4444', 'match.result_set': '#f59e0b', 'leaderboard.recalculated': '#8b5cf6',
    'code.created': '#0ea5e9', 'prediction.created': '#10b981', 'prediction.updated': '#6366f1',
  }

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Übersicht</h1>
          <p className="admin-page-sub">Willkommen im Admin-Panel</p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="admin-stat-card">
            <div className={`admin-stat-icon admin-stat-icon--${color}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">{value}</div>
              <div className="admin-stat-label">{label}</div>
              {sub && <div className="admin-stat-sub">{sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-grid">

        {/* Quick Actions */}
        <div>
          <div className="admin-section-title">Schnellaktionen</div>
          <div className="admin-actions-list">

            <div className="admin-action-card">
              <div className="admin-action-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                <Download size={18} />
              </div>
              <div className="admin-action-body">
                <div className="admin-action-title">Ergebnisse aktualisieren</div>
                <div className="admin-action-desc">Spielstände von der Football-API holen</div>
                <AutoUpdateAction />
              </div>
            </div>

            <div className="admin-action-card">
              <div className="admin-action-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <RefreshCcw size={18} />
              </div>
              <div className="admin-action-body">
                <div className="admin-action-title">Rangliste neu berechnen</div>
                <div className="admin-action-desc">Alle Punkte neu auswerten</div>
                <RecalculateAction />
              </div>
            </div>

          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="admin-section-title">Letzte Aktivität</div>
          <div className="admin-log-list">
            {recentLogs.length === 0 ? (
              <div className="admin-log-empty">Noch keine Einträge</div>
            ) : recentLogs.map((log) => (
              <div key={log.id} className="admin-log-row">
                <div
                  className="admin-log-dot"
                  style={{ background: actionColor[log.action] ?? '#94a3b8' }}
                />
                <div className="admin-log-body">
                  <span className="admin-log-actor">{log.actor_name}</span>
                  <span className="admin-log-action">{log.action}</span>
                </div>
                <div className="admin-log-time">{formatDateTime(log.created_at)}</div>
              </div>
            ))}
            {recentLogs.length > 0 && (
              <a href="/admin/logs" className="admin-log-more">Alle Logs ansehen →</a>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
