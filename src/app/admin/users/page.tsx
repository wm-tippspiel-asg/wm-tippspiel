import { getDb, queryAll } from '@/lib/db'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
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
  const userCount = users.filter((u) => u.role === 'user').length
  const bannedCount = users.filter((u) => u.is_banned).length

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Nutzerverwaltung"
        description={`${userCount} registriert${bannedCount > 0 ? ` · ${bannedCount} gesperrt` : ''}`}
      />
      <AdminUsersClient initialUsers={users} />
    </div>
  )
}
