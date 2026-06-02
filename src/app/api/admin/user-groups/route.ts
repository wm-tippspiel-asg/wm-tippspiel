import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, execute } from '@/lib/db'
import { audit } from '@/lib/audit'
import type { UserGroup } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('x-user-role') !== 'admin')
    return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

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

  return NextResponse.json({ success: true, data: groups })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  if (request.headers.get('x-user-role') !== 'admin')
    return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  let body: { name?: string; description?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name || name.length < 2 || name.length > 60)
    return NextResponse.json({ success: false, error: 'Name muss 2–60 Zeichen lang sein.' }, { status: 400 })

  const db = getDb()
  try {
    await execute(
      db,
      `INSERT INTO user_groups (name, description, created_by) VALUES (?, ?, ?)`,
      [name, body.description?.trim() ?? null, actorId],
    )
  } catch {
    return NextResponse.json({ success: false, error: 'Gruppenname bereits vergeben.' }, { status: 409 })
  }

  await audit({ actorId, actorName, action: 'group.created', details: { name } })
  return NextResponse.json({ success: true }, { status: 201 })
}
