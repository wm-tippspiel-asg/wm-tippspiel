import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, queryOne, execute } from '@/lib/db'
import { predictionSchema } from '@/lib/validation'
import { isMatchLocked } from '@/lib/utils'
import { audit } from '@/lib/audit'
import type { Prediction, Match } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('match_id')
  const db = getDb()

  // If match_id is provided, fetch all predictions for that match (with username)
  if (matchId) {
    const predictions = await queryAll<Prediction & { username: string }>(
      db,
      `SELECT p.*, u.username
       FROM predictions p
       JOIN users u ON u.id = p.user_id
       WHERE p.match_id = ?`,
      [matchId],
    )
    return NextResponse.json({ success: true, data: predictions })
  }

  // Otherwise fetch all predictions for the current user (original behavior)
  const predictions = await queryAll<Prediction & {
    match_home_team: string
    match_away_team: string
    match_time: string
    match_status: string
    home_team_flag: string | null
    away_team_flag: string | null
    match_home_score: number | null
    match_away_score: number | null
    round: string
  }>(
    db,
    `SELECT
      p.*,
      m.home_team AS match_home_team,
      m.away_team AS match_away_team,
      m.match_time,
      m.status AS match_status,
      m.home_team_flag,
      m.away_team_flag,
      m.home_score AS match_home_score,
      m.away_score AS match_away_score,
      m.round
    FROM predictions p
    JOIN matches m ON p.match_id = m.id
    WHERE p.user_id = ?
    ORDER BY m.match_time ASC`,
    [userId],
  )

  return NextResponse.json({ success: true, data: predictions })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const username = request.headers.get('x-username') ?? 'unknown'
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const parsed = predictionSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return NextResponse.json({ success: false, error: first?.message ?? 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { match_id, home_score, away_score } = parsed.data
  const db = getDb()

  // Fetch match and verify it's not locked
  const match = await queryOne<Match>(db, 'SELECT * FROM matches WHERE id = ?', [match_id])
  if (!match) {
    return NextResponse.json({ success: false, error: 'Spiel nicht gefunden.' }, { status: 404 })
  }

  // Server-side lock check — critical security check
  if (isMatchLocked(match.match_time) || match.status === 'locked' || match.status === 'finished' || match.status === 'cancelled') {
    return NextResponse.json(
      { success: false, error: 'Dieses Spiel ist gesperrt. Tipps können nicht mehr abgegeben oder geändert werden.' },
      { status: 403 },
    )
  }

  // Upsert prediction
  const existing = await queryOne<Prediction>(
    db,
    'SELECT id FROM predictions WHERE user_id = ? AND match_id = ?',
    [userId, match_id],
  )

  const action = existing ? 'prediction.updated' : 'prediction.created'

  await execute(
    db,
    `INSERT INTO predictions (user_id, match_id, home_score, away_score)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, match_id) DO UPDATE SET
       home_score = excluded.home_score,
       away_score = excluded.away_score,
       updated_at = datetime('now')`,
    [userId, match_id, home_score, away_score],
  )

  await audit({
    actorId: userId,
    actorName: username,
    action,
    targetType: 'prediction',
    targetId: match_id,
    details: { home_score, away_score },
  })

  return NextResponse.json({ success: true, message: 'Tipp gespeichert.' })
}
