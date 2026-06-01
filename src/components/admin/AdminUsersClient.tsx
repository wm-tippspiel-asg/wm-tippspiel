'use client'

import { useState } from 'react'
import { Search, Shield, ShieldOff, Trash2, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import type { User } from '@/types'

interface AdminUsersClientProps {
  initialUsers: Omit<User, 'password_hash'>[]
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<{
    type: 'ban' | 'unban' | 'delete'
    userId: string
    username: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const filtered = users.filter(
    (u) => u.username.toLowerCase().includes(search.toLowerCase()),
  )

  async function doAction() {
    if (!confirm) return
    setLoading(true)
    setMsg('')

    try {
      let res: Response
      if (confirm.type === 'delete') {
        res = await fetch(`/api/admin/users/${confirm.userId}`, { method: 'DELETE' })
      } else {
        res = await fetch(`/api/admin/users/${confirm.userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: confirm.type }),
        })
      }

      const d = await res.json() as { success: boolean; message?: string; error?: string }
      if (d.success) {
        if (confirm.type === 'delete') {
          setUsers((prev) => prev.filter((u) => u.id !== confirm.userId))
        } else {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === confirm.userId
                ? { ...u, is_banned: confirm.type === 'ban' }
                : u,
            ),
          )
        }
        setMsg(d.message ?? 'Fertig.')
      } else {
        setMsg(d.error ?? 'Fehler.')
      }
    } catch {
      setMsg('Verbindungsfehler.')
    } finally {
      setLoading(false)
      setConfirm(null)
    }
  }

  return (
    <>
      <div className="card">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Nutzer suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          {msg && <p className="mt-2 text-xs text-slate-500">{msg}</p>}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Nutzer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Rolle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Registriert</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">Letzter Login</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{user.username}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={user.role === 'admin' ? 'purple' : 'slate'}>
                      {user.role === 'admin' ? 'Admin' : 'Schüler'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs hidden lg:table-cell">
                    {user.last_login ? formatDate(user.last_login) : '–'}
                  </td>
                  <td className="px-4 py-3">
                    {user.is_banned ? (
                      <Badge variant="red">Gesperrt</Badge>
                    ) : (
                      <Badge variant="green">Aktiv</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <div className="flex items-center justify-end gap-1">
                        {user.is_banned ? (
                          <button
                            title="Entsperren"
                            onClick={() => setConfirm({ type: 'unban', userId: user.id, username: user.username })}
                            className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                          >
                            <ShieldOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            title="Sperren"
                            onClick={() => setConfirm({ type: 'ban', userId: user.id, username: user.username })}
                            className="p-1.5 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          title="Löschen"
                          onClick={() => setConfirm({ type: 'delete', userId: user.id, username: user.username })}
                          className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Keine Nutzer gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      <ConfirmModal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={doAction}
        loading={loading}
        title={
          confirm?.type === 'delete'
            ? `Nutzer "${confirm?.username}" löschen?`
            : confirm?.type === 'ban'
            ? `Nutzer "${confirm?.username}" sperren?`
            : `Nutzer "${confirm?.username}" entsperren?`
        }
        description={
          confirm?.type === 'delete'
            ? 'Alle Tipps und Daten dieses Nutzers werden unwiderruflich gelöscht.'
            : confirm?.type === 'ban'
            ? 'Der Nutzer kann sich nicht mehr anmelden. Laufende Sitzungen werden beendet.'
            : 'Der Nutzer kann sich wieder anmelden.'
        }
        confirmLabel={
          confirm?.type === 'delete' ? 'Endgültig löschen' : confirm?.type === 'ban' ? 'Sperren' : 'Entsperren'
        }
        confirmVariant={confirm?.type === 'unban' ? 'primary' : 'danger'}
      />
    </>
  )
}
