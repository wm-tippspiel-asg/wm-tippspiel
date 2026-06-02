import { NextRequest, NextResponse } from 'next/server'
import { getDb, execute } from '@/lib/db'
import { audit } from '@/lib/audit'

export const runtime = 'edge'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  if (request.headers.get('x-user-role') !== 'admin')
    return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id, userId } = await params
  const db = getDb()
  await execute(db, `DELETE FROM user_group_members WHERE group_id = ? AND user_id = ?`, [id, userId])
  await audit({ actorId, actorName, action: 'group.member_removed', targetType: 'group', targetId: id, details: { user_id: userId } })
  return NextResponse.json({ success: true })
}
