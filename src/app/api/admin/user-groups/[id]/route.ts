import { NextRequest, NextResponse } from 'next/server'
import { getDb, execute } from '@/lib/db'
import { audit } from '@/lib/audit'

export const runtime = 'edge'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  if (request.headers.get('x-user-role') !== 'admin')
    return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()
  await execute(db, `DELETE FROM user_groups WHERE id = ?`, [id])
  await audit({ actorId, actorName, action: 'group.deleted', targetType: 'group', targetId: id })
  return NextResponse.json({ success: true })
}
