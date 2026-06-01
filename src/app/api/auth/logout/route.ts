import { NextRequest, NextResponse } from 'next/server'
import { getSessionTokenFromRequest, invalidateSession, clearSessionCookie } from '@/lib/auth'
import { audit } from '@/lib/audit'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = getSessionTokenFromRequest(request)
  const userId = request.headers.get('x-user-id')
  const username = request.headers.get('x-username') ?? 'unknown'

  if (token) {
    try {
      await invalidateSession(token)
    } catch {}
  }

  if (userId) {
    await audit({
      actorId: userId,
      actorName: username,
      action: 'user.logout',
      ipAddress: request.headers.get('cf-connecting-ip') ?? undefined,
    })
  }

  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
}
