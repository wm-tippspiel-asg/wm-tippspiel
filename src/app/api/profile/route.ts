import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryOne, execute } from '@/lib/db'
import { profileUpdateSchema, passwordChangeSchema, sanitizeString } from '@/lib/validation'
import { verifyPassword, hashPassword } from '@/lib/crypto'
import { audit } from '@/lib/audit'
import type { User } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const db = getDb()
  const user = await queryOne<Omit<User, 'password_hash'>>(
    db,
    'SELECT id, username, email, role, is_banned, created_at, last_login FROM users WHERE id = ?',
    [userId],
  )

  if (!user) return NextResponse.json({ success: false, error: 'Nutzer nicht gefunden.' }, { status: 404 })

  const stats = await queryOne<{
    total_tips: number
    total_points: number
    exact_results: number
  }>(
    db,
    `SELECT
      COUNT(*) AS total_tips,
      COALESCE(SUM(points), 0) AS total_points,
      COUNT(CASE WHEN points = (SELECT value FROM scoring_config WHERE key = 'exact_result') THEN 1 END) AS exact_results
    FROM predictions WHERE user_id = ?`,
    [userId],
  )

  return NextResponse.json({ success: true, data: { user, stats } })
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const db = getDb()

  // Detect which operation: username update or password change
  if ((body as Record<string, unknown>).current_password !== undefined) {
    // Password change
    const parsed = passwordChangeSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      return NextResponse.json({ success: false, error: first?.message ?? 'Ungültige Eingabe.' }, { status: 400 })
    }

    const { current_password, new_password } = parsed.data
    const user = await queryOne<{ password_hash: string; username: string }>(
      db,
      'SELECT password_hash, username FROM users WHERE id = ?',
      [userId],
    )
    if (!user) return NextResponse.json({ success: false, error: 'Nutzer nicht gefunden.' }, { status: 404 })

    const valid = await verifyPassword(current_password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Aktuelles Passwort ist falsch.' }, { status: 400 })
    }

    const newHash = await hashPassword(new_password)
    await execute(db, `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`, [newHash, userId])

    await audit({
      actorId: userId,
      actorName: user.username,
      action: 'user.password_changed',
      targetType: 'user',
      targetId: userId,
    })

    return NextResponse.json({ success: true, message: 'Passwort geändert.' })
  } else {
    // Username update
    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      return NextResponse.json({ success: false, error: first?.message ?? 'Ungültige Eingabe.' }, { status: 400 })
    }

    const { username } = parsed.data
    const safeUsername = sanitizeString(username)

    const exists = await queryOne<{ id: string }>(
      db,
      'SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?',
      [safeUsername, userId],
    )
    if (exists) {
      return NextResponse.json({ success: false, error: 'Dieser Benutzername ist bereits vergeben.' }, { status: 409 })
    }

    const current = await queryOne<{ username: string }>(db, 'SELECT username FROM users WHERE id = ?', [userId])

    await execute(
      db,
      `UPDATE users SET username = ?, updated_at = datetime('now') WHERE id = ?`,
      [safeUsername, userId],
    )

    // Update leaderboard
    await execute(db, 'UPDATE leaderboard SET username = ? WHERE user_id = ?', [safeUsername, userId])

    await audit({
      actorId: userId,
      actorName: current?.username ?? 'unknown',
      action: 'user.profile_updated',
      details: { old_username: current?.username, new_username: safeUsername },
    })

    return NextResponse.json({ success: true, message: 'Profil aktualisiert.' })
  }
}
