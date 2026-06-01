import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryOne, execute } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/crypto'
import { createSession, setSessionCookie } from '@/lib/auth'
import { registerSchema, getIpAddress, sanitizeString } from '@/lib/validation'
import { rateLimitRegister } from '@/lib/rateLimit'
import { audit } from '@/lib/audit'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getIpAddress(request)

  const rl = await rateLimitRegister(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Zu viele Registrierungsversuche. Bitte warte eine Stunde.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return NextResponse.json(
      { success: false, error: first?.message ?? 'Ungültige Eingabe.' },
      { status: 400 },
    )
  }

  const { username, password, code } = parsed.data
  const safeUsername = sanitizeString(username)
  const db = getDb()

  // Check username availability
  const existing = await queryOne<{ id: string }>(
    db,
    'SELECT id FROM users WHERE username = ? COLLATE NOCASE',
    [safeUsername],
  )
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Dieser Benutzername ist bereits vergeben.' },
      { status: 409 },
    )
  }

  // Validate registration code
  const regCode = await queryOne<{
    id: string
    max_uses: number | null
    uses_count: number
    expires_at: string | null
    is_active: number
  }>(
    db,
    `SELECT id, max_uses, uses_count, expires_at, is_active
     FROM registration_codes
     WHERE code = ? COLLATE NOCASE`,
    [code],
  )

  if (!regCode || !regCode.is_active) {
    return NextResponse.json(
      { success: false, error: 'Ungültiger oder abgelaufener Zugangscode.' },
      { status: 400 },
    )
  }

  if (regCode.expires_at && new Date(regCode.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, error: 'Dieser Zugangscode ist abgelaufen.' },
      { status: 400 },
    )
  }

  if (regCode.max_uses !== null && regCode.uses_count >= regCode.max_uses) {
    return NextResponse.json(
      { success: false, error: 'Dieser Zugangscode wurde bereits zu oft verwendet.' },
      { status: 400 },
    )
  }

  const passwordHash = await hashPassword(password)
  const userId = generateToken(16)

  // Transaction: create user + record code usage + increment counter
  await execute(
    db,
    `INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, 'user')`,
    [userId, safeUsername, passwordHash],
  )

  await execute(
    db,
    `INSERT INTO code_uses (code_id, user_id) VALUES (?, ?)`,
    [regCode.id, userId],
  )

  await execute(
    db,
    `UPDATE registration_codes SET uses_count = uses_count + 1 WHERE id = ?`,
    [regCode.id],
  )

  await audit({
    actorId: userId,
    actorName: safeUsername,
    action: 'user.created',
    details: { code_id: regCode.id, ip },
    ipAddress: ip,
  })

  const token = await createSession(userId, ip, request.headers.get('user-agent') ?? undefined)
  const response = NextResponse.json({
    success: true,
    data: { id: userId, username: safeUsername, role: 'user' },
  })

  await setSessionCookie(token, response)
  return response
}
