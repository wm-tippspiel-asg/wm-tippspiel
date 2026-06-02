import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, queryOne, execute } from '@/lib/db'
import { predictionSchema } from '@/lib/validation'
import { isMatchLocked } from '@/lib/utils'
import { audit } from '@/lib/audit'
import type { Match } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const groupId = new URL(request.url).searchParams.get('group_id')

  const db = getDb()
  const rows = await queryAll<{
    id: string; user_id: string; group_id: string; match_id: string
    home_score: number; away_score: number; points: number | null
    created_at: string; updated_at: string
  }>(
    db,
    groupId
      ? `SELECT * FROM group_predictions WHERE user_id = ? AND group_id = ?`
      : `SELECT * FROM group_predictions WHERE user_id = ?`,
    groupId ? [userId, groupId] : [userId],
  )

  return NextResponse.json({ success: true, data: rows })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const username = request.headers.get('x-username') ?? 'unknown'
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const parsed = predictionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { match_id, home_score, away_score } = parsed.data
  const group_id = (body as { group_id?: string }).group_id
  if (!group_id) return NextResponse.json({ success: false, error: 'group_id fehlt.' }, { status: 400 })

  const db = getDb()

  // Verify user is member of this group
  const membership = await queryOne<{ user_id: string }>(
    db,
    'SELECT user_id FROM user_group_members WHERE user_id = ? AND group_id = ?',
    [userId, group_id],
  )
  if (!membership) return NextResponse.json({ success: false, error: 'Du bist kein Mitglied dieser Gruppe.' }, { status: 403 })

  // Verify match is not locked
  const match = await queryOne<Match>(db, 'SELECT * FROM matches WHERE id = ?', [match_id])
  if (!match) return NextResponse.json({ success: false, error: 'Spiel nicht gefunden.' }, { status: 404 })

  if (isMatchLocked(match.match_time) || match.status === 'locked' || match.status === 'finished' || match.status === 'cancelled') {
    return NextResponse.json({ success: false, error: 'Dieses Spiel ist gesperrt.' }, { status: 403 })
  }

  const existing = await queryOne<{ id: string }>(
    db,
    'SELECT id FROM group_predictions WHERE user_id = ? AND group_id = ? AND match_id = ?',
    [userId, group_id, match_id],
  )

  await execute(
    db,
    `INSERT INTO group_predictions (user_id, group_id, match_id, home_score, away_score)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, group_id, match_id) DO UPDATE SET
       home_score = excluded.home_score,
       away_score = excluded.away_score,
       updated_at = datetime('now')`,
    [userId, group_id, match_id, home_score, away_score],
  )

  await audit({
    actorId: userId,
    actorName: username,
    action: existing ? 'group_prediction.updated' : 'group_prediction.created',
    targetType: 'prediction',
    targetId: match_id,
    details: { group_id, home_score, away_score },
  })

  return NextResponse.json({ success: true, message: 'Gruppen-Tipp gespeichert.' })
}
