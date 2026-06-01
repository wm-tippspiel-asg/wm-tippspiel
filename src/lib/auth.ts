import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateToken, hashToken, signHmac, verifyHmac } from './crypto'
import { getDb, getSecret, queryOne, execute } from './db'
import type { User, Session, AuthUser } from '@/types'

const SESSION_COOKIE = 'wm_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ============================================================
// Session creation
// ============================================================

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<string> {
  const db = getDb()
  const secret = getSecret()

  const rawToken = generateToken(32)
  const tokenHash = await hashToken(rawToken)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

  // Sign the token to detect tampering
  const signature = await signHmac(rawToken, secret)
  const signedToken = `${rawToken}.${signature}`

  await execute(
    db,
    `INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, ipAddress ?? null, userAgent ?? null],
  )

  // Update last login
  await execute(db, `UPDATE users SET last_login = datetime('now') WHERE id = ?`, [userId])

  return signedToken
}

// ============================================================
// Session validation
// ============================================================

export async function validateSession(signedToken: string): Promise<AuthUser | null> {
  const db = getDb()
  const secret = getSecret()

  const dotIdx = signedToken.lastIndexOf('.')
  if (dotIdx === -1) return null

  const rawToken = signedToken.slice(0, dotIdx)
  const signature = signedToken.slice(dotIdx + 1)

  const isValid = await verifyHmac(rawToken, signature, secret)
  if (!isValid) return null

  const tokenHash = await hashToken(rawToken)

  const session = await queryOne<Session & { role: string; username: string; is_banned: number }>(
    db,
    `SELECT s.*, u.role, u.username, u.is_banned
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = ?
       AND s.expires_at > datetime('now')`,
    [tokenHash],
  )

  if (!session) return null

  return {
    id: session.user_id,
    username: session.username,
    role: session.role as 'admin' | 'user',
    is_banned: session.is_banned === 1,
  }
}

// ============================================================
// Cookie helpers
// ============================================================

export async function setSessionCookie(token: string, response: NextResponse): Promise<void> {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}

export function getSessionTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

// ============================================================
// Session invalidation
// ============================================================

export async function invalidateSession(signedToken: string): Promise<void> {
  const db = getDb()
  const secret = getSecret()

  const dotIdx = signedToken.lastIndexOf('.')
  if (dotIdx === -1) return

  const rawToken = signedToken.slice(0, dotIdx)
  const signature = signedToken.slice(dotIdx + 1)

  const isValid = await verifyHmac(rawToken, signature, secret)
  if (!isValid) return

  const tokenHash = await hashToken(rawToken)
  await execute(db, `DELETE FROM sessions WHERE token_hash = ?`, [tokenHash])
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const db = getDb()
  await execute(db, `DELETE FROM sessions WHERE user_id = ?`, [userId])
}

// ============================================================
// Purge expired sessions (maintenance)
// ============================================================

export async function purgeExpiredSessions(): Promise<number> {
  const db = getDb()
  const result = await execute(db, `DELETE FROM sessions WHERE expires_at <= datetime('now')`)
  return result.meta.changes ?? 0
}

// ============================================================
// Get current user (server component helper)
// ============================================================

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = await getSessionTokenFromCookies()
    if (!token) return null
    return await validateSession(token)
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  if (user.is_banned) throw new Error('BANNED')
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}
