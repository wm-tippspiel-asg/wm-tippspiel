import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryOne, execute } from '@/lib/db'
import { matchSchema, matchResultSchema } from '@/lib/validation'
import { audit } from '@/lib/audit'
import { recalculateMatchPoints } from '@/lib/scoring'
import { invalidateCache, CACHE_KEYS } from '@/lib/cache'
import type { Match } from '@/types'

export const runtime = 'edge'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()

  const match = await queryOne<Match>(db, 'SELECT * FROM matches WHERE id = ?', [id])
  if (!match) return NextResponse.json({ success: false, error: 'Spiel nicht gefunden.' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  // Check for result update vs. full update
  const b = body as Record<string, unknown>
  if ('home_score' in b && 'away_score' in b && !('home_team' in b)) {
    // Result update
    const parsed = matchResultSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Ungültiger Spielstand.' }, { status: 400 })
    }

    const { home_score, away_score, status: matchStatus } = parsed.data
    await execute(
      db,
      `UPDATE matches SET home_score = ?, away_score = ?, status = ?, score_locked = 1, updated_at = datetime('now') WHERE id = ?`,
      [home_score, away_score, matchStatus, id],
    )

    // Recalculate points whenever scores are updated (for both live and finished matches)
    await recalculateMatchPoints(id)
    
    // Always invalidate leaderboard caches when scores change
    await invalidateCache(
      CACHE_KEYS.LEADERBOARD_ALL,
      CACHE_KEYS.LEADERBOARD_GROUPS,
      'cache:leaderboard:top5',
      'cache:leaderboard:ranking',
      'cache:leaderboard:live',
      CACHE_KEYS.MATCHES_UPCOMING,
    )

    await audit({
      actorId,
      actorName,
      action: 'match.result_set',
      targetType: 'match',
      targetId: id,
      details: { home_score, away_score, status: matchStatus, home_team: match.home_team, away_team: match.away_team },
    })

    const msg = matchStatus === 'finished'
      ? 'Ergebnis eingetragen und Punkte berechnet.'
      : 'Zwischenstand aktualisiert.'
    return NextResponse.json({ success: true, message: msg })
  }

  // Full match update
  const parsed = matchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe.' }, { status: 400 })
  }

  const data = parsed.data
  await execute(
    db,
    `UPDATE matches SET
      home_team = ?, away_team = ?, home_team_flag = ?, away_team_flag = ?,
      match_time = ?, round = ?, group_name = ?, venue = ?,
      updated_at = datetime('now')
     WHERE id = ?`,
    [data.home_team, data.away_team, data.home_team_flag ?? null, data.away_team_flag ?? null,
     data.match_time, data.round, data.group_name ?? null, data.venue ?? null, id],
  )

  await invalidateCache(CACHE_KEYS.MATCHES_UPCOMING)

  await audit({
    actorId,
    actorName,
    action: 'match.updated',
    targetType: 'match',
    targetId: id,
    details: { home_team: data.home_team, away_team: data.away_team },
  })

  return NextResponse.json({ success: true, message: 'Spiel aktualisiert.' })
}

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const { action } = body as { action?: string }

  if (action === 'lock') {
    await execute(
      db,
      `UPDATE matches SET status = 'locked', locked_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [id],
    )
    await invalidateCache(CACHE_KEYS.MATCHES_UPCOMING)
    return NextResponse.json({ success: true, message: 'Spiel gesperrt.' })
  }

  if (action === 'unlock') {
    await execute(
      db,
      `UPDATE matches SET status = 'scheduled', locked_at = NULL, updated_at = datetime('now') WHERE id = ?`,
      [id],
    )
    await invalidateCache(CACHE_KEYS.MATCHES_UPCOMING)
    return NextResponse.json({ success: true, message: 'Spiel entsperrt.' })
  }

  if (action === 'unlock_score') {
    await execute(
      db,
      `UPDATE matches SET score_locked = 0, updated_at = datetime('now') WHERE id = ?`,
      [id],
    )
    return NextResponse.json({ success: true, message: 'Score-Sperre aufgehoben.' })
  }

  return NextResponse.json({ success: false, error: 'Unbekannte Aktion.' }, { status: 400 })
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const { id } = await params
  const db = getDb()

  const match = await queryOne<Match>(db, 'SELECT * FROM matches WHERE id = ?', [id])
  if (!match) return NextResponse.json({ success: false, error: 'Spiel nicht gefunden.' }, { status: 404 })

  await execute(db, 'DELETE FROM matches WHERE id = ?', [id])

  await audit({
    actorId,
    actorName,
    action: 'match.deleted',
    targetType: 'match',
    targetId: id,
    details: { home_team: match.home_team, away_team: match.away_team },
  })

  return NextResponse.json({ success: true, message: 'Spiel gelöscht.' })
}
