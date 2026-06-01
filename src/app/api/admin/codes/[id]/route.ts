import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryOne, execute } from '@/lib/db'
import { audit } from '@/lib/audit'

export const runtime = 'edge'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()

  const code = await queryOne<{ code: string; is_active: number }>(
    db, 'SELECT code, is_active FROM registration_codes WHERE id = ?', [id],
  )
  if (!code) return NextResponse.json({ success: false, error: 'Code nicht gefunden.' }, { status: 404 })

  const newActive = code.is_active ? 0 : 1
  await execute(db, 'UPDATE registration_codes SET is_active = ? WHERE id = ?', [newActive, id])

  await audit({
    actorId,
    actorName,
    action: newActive ? 'code.created' : 'code.deactivated',
    targetType: 'code',
    targetId: id,
    details: { code: code.code },
  })

  return NextResponse.json({ success: true, message: newActive ? 'Code aktiviert.' : 'Code deaktiviert.' })
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()

  const code = await queryOne<{ code: string }>(db, 'SELECT code FROM registration_codes WHERE id = ?', [id])
  if (!code) return NextResponse.json({ success: false, error: 'Code nicht gefunden.' }, { status: 404 })

  await execute(db, 'DELETE FROM registration_codes WHERE id = ?', [id])

  await audit({
    actorId,
    actorName,
    action: 'code.deleted',
    targetType: 'code',
    targetId: id,
    details: { code: code.code },
  })

  return NextResponse.json({ success: true, message: 'Code gelöscht.' })
}
