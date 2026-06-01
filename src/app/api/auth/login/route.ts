import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/crypto'
import { createSession, setSessionCookie } from '@/lib/auth'
import { loginSchema, getIpAddress } from '@/lib/validation'
import { rateLimitLogin } from '@/lib/rateLimit'
import { audit } from '@/lib/audit'
import type { User } from '@/types'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getIpAddress(request)

  // Rate limiting
  const rl = await rateLimitLogin(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Zu viele Versuche. Bitte warte 15 Minuten.' },
      { status: 429 },
    )
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Benutzername und Passwort sind erforderlich.' },
      { status: 400 },
    )
  }

  const { username, password } = parsed.data
  const db = getDb()

  const user = await queryOne<User>(
    db,
    'SELECT * FROM users WHERE username = ? COLLATE NOCASE',
    [username],
  )

  // Constant-time response — never reveal whether user exists
  if (!user) {
    await simulatePasswordCheck()
    return NextResponse.json(
      { success: false, error: 'Ungültige Anmeldedaten.' },
      { status: 401 },
    )
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    await audit({
      actorId: user.id,
      actorName: user.username,
      action: 'user.login',
      details: { success: false, ip },
      ipAddress: ip,
    })
    return NextResponse.json(
      { success: false, error: 'Ungültige Anmeldedaten.' },
      { status: 401 },
    )
  }

  if (user.is_banned) {
    return NextResponse.json(
      { success: false, error: 'Dein Konto wurde gesperrt.' },
      { status: 403 },
    )
  }

  const token = await createSession(
    user.id,
    ip,
    request.headers.get('user-agent') ?? undefined,
  )

  await audit({
    actorId: user.id,
    actorName: user.username,
    action: 'user.login',
    details: { success: true, ip },
    ipAddress: ip,
  })

  const response = NextResponse.json({
    success: true,
    data: { id: user.id, username: user.username, role: user.role },
  })

  await setSessionCookie(token, response)
  return response
}

async function simulatePasswordCheck(): Promise<void> {
  await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new Uint8Array(16), iterations: 1000, hash: 'SHA-256' },
    await crypto.subtle.importKey('raw', new TextEncoder().encode('dummy'), 'PBKDF2', false, ['deriveBits']),
    256,
  )
}
