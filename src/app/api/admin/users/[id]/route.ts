import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryOne, execute } from '@/lib/db'
import { invalidateAllUserSessions } from '@/lib/auth'
import { audit } from '@/lib/audit'
import type { User } from '@/types'

export const runtime = 'edge'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()

  const user = await queryOne<Omit<User, 'password_hash'>>(
    db,
    'SELECT id, username, email, role, is_banned, ban_reason, created_at, last_login FROM users WHERE id = ?',
    [id],
  )

  if (!user) return NextResponse.json({ success: false, error: 'Nutzer nicht gefunden.' }, { status: 404 })
  return NextResponse.json({ success: true, data: user })
}

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()

  // Prevent admin from modifying own account in destructive ways
  if (id === actorId) {
    return NextResponse.json({ success: false, error: 'Du kannst dein eigenes Konto nicht sperren.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const { action, reason } = body as { action?: string; reason?: string }

  const user = await queryOne<User>(db, 'SELECT * FROM users WHERE id = ?', [id])
  if (!user) return NextResponse.json({ success: false, error: 'Nutzer nicht gefunden.' }, { status: 404 })

  if (user.role === 'admin') {
    return NextResponse.json({ success: false, error: 'Admin-Konten können nicht bearbeitet werden.' }, { status: 403 })
  }

  if (action === 'ban') {
    await execute(
      db,
      `UPDATE users SET is_banned = 1, ban_reason = ?, updated_at = datetime('now') WHERE id = ?`,
      [reason ?? null, id],
    )
    await invalidateAllUserSessions(id)
    await audit({
      actorId,
      actorName,
      action: 'user.banned',
      targetType: 'user',
      targetId: id,
      details: { username: user.username, reason },
    })
    return NextResponse.json({ success: true, message: 'Nutzer wurde gesperrt.' })
  }

  if (action === 'unban') {
    await execute(
      db,
      `UPDATE users SET is_banned = 0, ban_reason = NULL, updated_at = datetime('now') WHERE id = ?`,
      [id],
    )
    await audit({
      actorId,
      actorName,
      action: 'user.unbanned',
      targetType: 'user',
      targetId: id,
      details: { username: user.username },
    })
    return NextResponse.json({ success: true, message: 'Nutzer wurde entsperrt.' })
  }

  return NextResponse.json({ success: false, error: 'Unbekannte Aktion.' }, { status: 400 })
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  if (id === actorId) {
    return NextResponse.json({ success: false, error: 'Du kannst dein eigenes Konto nicht löschen.' }, { status: 400 })
  }

  const db = getDb()
  const user = await queryOne<User>(db, 'SELECT * FROM users WHERE id = ?', [id])
  if (!user) return NextResponse.json({ success: false, error: 'Nutzer nicht gefunden.' }, { status: 404 })

  if (user.role === 'admin') {
    return NextResponse.json({ success: false, error: 'Admin-Konten können nicht gelöscht werden.' }, { status: 403 })
  }

  await invalidateAllUserSessions(id)
  await execute(db, 'DELETE FROM users WHERE id = ?', [id])

  await audit({
    actorId,
    actorName,
    action: 'user.deleted',
    targetType: 'user',
    targetId: id,
    details: { username: user.username },
  })

  return NextResponse.json({ success: true, message: 'Nutzer wurde gelöscht.' })
}
