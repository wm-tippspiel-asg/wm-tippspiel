import { getDb, queryAll } from '@/lib/db'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'
import type { Metadata } from 'next'
import type { User } from '@/types'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Nutzerverwaltung' }

export default async function AdminUsersPage() {
  const db = getDb()
  const users = await queryAll<Omit<User, 'password_hash'>>(
    db,
    `SELECT id, username, email, role, is_banned, ban_reason, created_at, last_login
     FROM users ORDER BY created_at DESC`,
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Nutzerverwaltung</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {users.filter((u) => u.role === 'user').length} Schülerinnen und Schüler registriert
        </p>
      </div>
      <AdminUsersClient initialUsers={users} />
    </div>
  )
}
