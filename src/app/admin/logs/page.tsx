import { getDb, queryAll, queryOne } from '@/lib/db'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Audit-Logs' }

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>
}) {
  const { page: pageStr, action: actionFilter } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const perPage = 50
  const offset = (page - 1) * perPage

  const db = getDb()

  let sql = 'SELECT * FROM audit_logs WHERE 1=1'
  const params: unknown[] = []
  if (actionFilter) {
    sql += ' AND action = ?'
    params.push(actionFilter)
  }

  const total = await queryOne<{ count: number }>(
    db,
    sql.replace('SELECT *', 'SELECT COUNT(*) AS count'),
    params,
  )

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(perPage, offset)

  const logs = await queryAll<AuditLog>(db, sql, params)
  const totalPages = Math.ceil((total?.count ?? 0) / perPage)

  const actionBadge = (action: string) => {
    if (action.includes('deleted') || action.includes('banned')) return 'red'
    if (action.includes('created') || action.includes('login')) return 'green'
    if (action.includes('updated') || action.includes('changed')) return 'blue'
    return 'slate'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Audit-Logs</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {total?.count ?? 0} Einträge insgesamt
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Zeitpunkt</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Nutzer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Aktion</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Details</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => {
                let details: Record<string, unknown> = {}
                try { if (log.details) details = JSON.parse(log.details) } catch {}

                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-xs text-slate-900 dark:text-slate-100">
                      {log.actor_name}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={actionBadge(log.action) as 'red' | 'green' | 'blue' | 'slate'} className="text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 hidden md:table-cell max-w-xs truncate">
                      {Object.entries(details)
                        .filter(([k]) => k !== 'ip')
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(', ')}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 hidden lg:table-cell font-mono">
                      {log.ip_address ?? '–'}
                    </td>
                  </tr>
                )
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Keine Einträge gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Seite {page} von {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}`} className="btn-ghost text-xs">Zurück</a>
              )}
              {page < totalPages && (
                <a href={`?page=${page + 1}`} className="btn-ghost text-xs">Weiter</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
