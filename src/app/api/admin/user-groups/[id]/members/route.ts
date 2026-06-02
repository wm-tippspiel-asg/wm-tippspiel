import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, execute } from '@/lib/db'
import { audit } from '@/lib/audit'
import type { UserGroupMember } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  if (request.headers.get('x-user-role') !== 'admin')
    return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()
  const members = await queryAll<UserGroupMember>(
    db,
    `SELECT ugm.user_id, u.username, ugm.group_id, ugm.added_at
     FROM user_group_members ugm
     JOIN users u ON u.id = ugm.user_id
     WHERE ugm.group_id = ?
     ORDER BY u.username ASC`,
    [id],
  )

  return NextResponse.json({ success: true, data: members })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  if (request.headers.get('x-user-role') !== 'admin')
    return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  let body: { user_id?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!body.user_id)
    return NextResponse.json({ success: false, error: 'user_id fehlt.' }, { status: 400 })

  const { id } = await params
  const db = getDb()
  try {
    await execute(
      db,
      `INSERT INTO user_group_members (user_id, group_id, added_by) VALUES (?, ?, ?)`,
      [body.user_id, id, actorId],
    )
  } catch {
    return NextResponse.json({ success: false, error: 'Nutzer ist bereits in dieser Gruppe.' }, { status: 409 })
  }

  await audit({ actorId, actorName, action: 'group.member_added', targetType: 'group', targetId: id, details: { user_id: body.user_id } })
  return NextResponse.json({ success: true }, { status: 201 })
}
