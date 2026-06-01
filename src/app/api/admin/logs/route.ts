import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, queryOne } from '@/lib/db'
import type { AuditLog } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const db = getDb()
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = 50
  const offset = (page - 1) * perPage
  const action = searchParams.get('action')

  let sql = 'SELECT * FROM audit_logs WHERE 1=1'
  const params: unknown[] = []

  if (action) {
    sql += ' AND action = ?'
    params.push(action)
  }

  const countResult = await queryOne<{ count: number }>(
    db,
    sql.replace('SELECT *', 'SELECT COUNT(*) AS count'),
    params,
  )

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(perPage, offset)

  const logs = await queryAll<AuditLog>(db, sql, params)

  return NextResponse.json({
    success: true,
    data: {
      logs,
      total: countResult?.count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((countResult?.count ?? 0) / perPage),
    },
  })
}
