import { getDb, queryOne, queryAll } from '@/lib/db'
import { RecalculateAction } from '@/components/admin/RecalculateAction'
import { AutoUpdateAction } from '@/components/admin/AutoUpdateAction'
import { Users, Trophy, Key, FileText, Download, RefreshCcw, TrendingUp, Activity } from 'lucide-react'
import type { AuditLog } from '@/types'
import type { Metadata } from 'next'
import { formatDateTime } from '@/lib/utils'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Admin-Übersicht' }

export default async function AdminDashboard() {
  const db = getDb()

  const [
    userCount, matchCount, codeCount, logCount,
    finishedMatches, recentLogs,
    tipsToday, loginsToday, pendingMatches,
  ] = await Promise.all([
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM users WHERE role = 'user'`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM matches`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM registration_codes WHERE is_active = 1`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM audit_logs`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM matches WHERE status = 'finished'`),
    queryAll<AuditLog>(db, `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 8`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM predictions WHERE DATE(created_at) = DATE('now')`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM audit_logs WHERE action = 'user.login' AND DATE(created_at) = DATE('now')`),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM matches WHERE status = 'scheduled' AND match_time < datetime('now', '+24 hours') AND match_time > datetime('now')`),
  ])

  const actionColor: Record<string, string> = {
    'user.created': '#10b981', 'user.login': '#6366f1', 'user.banned': '#ef4444',
    'user.deleted': '#ef4444', 'match.result_set': '#f59e0b', 'leaderboard.recalculated': '#8b5cf6',
    'code.created': '#0ea5e9', 'prediction.created': '#10b981', 'prediction.updated': '#6366f1',
    'code.used': '#06b6d4',
  }

  return (
    <div className="admin-page">

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Übersicht</h1>
          <p className="admin-page-sub">Willkommen im Admin-Panel</p>
        </div>
      </div>

      {/* Main stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--indigo"><Users size={18} /></div>
          <div className="admin-stat-body">
            <div className="admin-stat-value">{userCount?.count ?? 0}</div>
            <div className="admin-stat-label">Schüler</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--emerald"><Trophy size={18} /></div>
          <div className="admin-stat-body">
            <div className="admin-stat-value">{finishedMatches?.count ?? 0}<span className="admin-stat-total"> / {matchCount?.count ?? 0}</span></div>
            <div className="admin-stat-label">Spiele beendet</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--amber"><Key size={18} /></div>
          <div className="admin-stat-body">
            <div className="admin-stat-value">{codeCount?.count ?? 0}</div>
            <div className="admin-stat-label">Aktive Codes</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--slate"><FileText size={18} /></div>
          <div className="admin-stat-body">
            <div className="admin-stat-value">{logCount?.count ?? 0}</div>
            <div className="admin-stat-label">Audit-Logs</div>
          </div>
        </div>
      </div>

      {/* Today strip */}
      <div className="admin-today-strip">
        <div className="admin-today-item">
          <TrendingUp size={14} />
          <span><strong>{tipsToday?.count ?? 0}</strong> Tipps heute</span>
        </div>
        <div className="admin-today-divider" />
        <div className="admin-today-item">
          <Activity size={14} />
          <span><strong>{loginsToday?.count ?? 0}</strong> Logins heute</span>
        </div>
        {(pendingMatches?.count ?? 0) > 0 && (
          <>
            <div className="admin-today-divider" />
            <div className="admin-today-item admin-today-warn">
              <Trophy size={14} />
              <span><strong>{pendingMatches?.count}</strong> Spiel{pendingMatches?.count === 1 ? '' : 'e'} in &lt;24h</span>
            </div>
          </>
        )}
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
                <div className="admin-log-dot" style={{ background: actionColor[log.action] ?? '#94a3b8' }} />
                <div className="admin-log-body">
                  <span className="admin-log-actor">{log.actor_name}</span>
                  <span className="admin-log-action">{log.action}</span>
                </div>
                <div className="admin-log-time">{formatDateTime(log.created_at)}</div>
              </div>
            ))}
            <a href="/admin/logs" className="admin-log-more">Alle Logs →</a>
          </div>
        </div>

      </div>
    </div>
  )
}
