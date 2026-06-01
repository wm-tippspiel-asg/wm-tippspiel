import { NextRequest, NextResponse } from 'next/server'
import { rebuildLeaderboard } from '@/lib/scoring'
import { audit } from '@/lib/audit'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  await rebuildLeaderboard()

  await audit({
    actorId,
    actorName,
    action: 'leaderboard.recalculated',
  })

  return NextResponse.json({ success: true, message: 'Rangliste wurde neu berechnet.' })
}
