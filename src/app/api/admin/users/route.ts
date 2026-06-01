import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, queryOne } from '@/lib/db'
import type { User } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const db = getDb()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q')?.trim()

  let sql = `SELECT id, username, email, role, is_banned, ban_reason, created_at, last_login FROM users`
  const params: unknown[] = []

  if (search) {
    sql += ` WHERE username LIKE ? COLLATE NOCASE`
    params.push(`%${search}%`)
  }

  sql += ` ORDER BY created_at DESC`

  const users = await queryAll<Omit<User, 'password_hash'>>(db, sql, params)
  return NextResponse.json({ success: true, data: users })
}
