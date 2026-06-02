import { getDb, queryAll } from '@/lib/db'
import { AdminGroupsClient } from '@/components/admin/AdminGroupsClient'
import type { UserGroup } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Gruppen' }

export default async function AdminGruppenPage() {
  const db = getDb()

  const groups = await queryAll<UserGroup & { member_count: number }>(
    db,
    `SELECT ug.id, ug.name, ug.description, ug.created_by, ug.created_at,
            COUNT(ugm.user_id) AS member_count
     FROM user_groups ug
     LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
     GROUP BY ug.id
     ORDER BY ug.name ASC`,
  )

  const users = await queryAll<{ id: string; username: string }>(
    db,
    `SELECT id, username FROM users WHERE is_banned = 0 ORDER BY username ASC`,
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Gruppen</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Klassen, Kurse, Abteilungen — Nutzer in Gruppen einteilen für eigene Ranglisten
        </p>
      </div>
      <AdminGroupsClient initialGroups={groups} allUsers={users} />
    </div>
  )
}
