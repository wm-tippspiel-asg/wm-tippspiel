import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, execute } from '@/lib/db'
import { matchSchema } from '@/lib/validation'
import { audit } from '@/lib/audit'
import { generateToken } from '@/lib/crypto'
import type { Match } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const db = getDb()
  const matches = await queryAll<Match>(db, 'SELECT * FROM matches ORDER BY match_time ASC')
  return NextResponse.json({ success: true, data: matches })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const parsed = matchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe.' }, { status: 400 })
  }

  const data = parsed.data
  const id = generateToken(16)
  const db = getDb()

  await execute(
    db,
    `INSERT INTO matches (id, home_team, away_team, home_team_flag, away_team_flag, match_time, round, group_name, venue)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.home_team, data.away_team, data.home_team_flag ?? null, data.away_team_flag ?? null,
     data.match_time, data.round, data.group_name ?? null, data.venue ?? null],
  )

  await audit({
    actorId,
    actorName,
    action: 'match.created',
    targetType: 'match',
    targetId: id,
    details: { home_team: data.home_team, away_team: data.away_team, match_time: data.match_time },
  })

  return NextResponse.json({ success: true, data: { id } }, { status: 201 })
}
