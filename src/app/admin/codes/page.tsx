import { getDb, queryAll } from '@/lib/db'
import { AdminCodesClient } from '@/components/admin/AdminCodesClient'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { RegistrationCode } from '@/types'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Zugangscodes' }

export default async function AdminCodesPage() {
  const db = getDb()
  const codes = await queryAll<RegistrationCode & { created_by_username: string }>(
    db,
    `SELECT rc.*, u.username AS created_by_username
     FROM registration_codes rc
     LEFT JOIN users u ON rc.created_by = u.id
     ORDER BY rc.created_at DESC`,
  )

  const active = codes.filter(c => c.is_active).length

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Zugangscodes"
        description={`${active} aktiv · ${codes.length} gesamt`}
      />
      <AdminCodesClient initialCodes={codes} />
    </div>
  )
}
