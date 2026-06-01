import { getDb, queryAll } from '@/lib/db'
import { AdminCodesClient } from '@/components/admin/AdminCodesClient'
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Zugangscodes</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {codes.filter((c) => c.is_active).length} aktive Codes
        </p>
      </div>
      <AdminCodesClient initialCodes={codes} />
    </div>
  )
}
