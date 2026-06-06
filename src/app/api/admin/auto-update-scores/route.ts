import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryOne, execute } from '@/lib/db'
import { rebuildLeaderboard } from '@/lib/scoring'
import { audit } from '@/lib/audit'
import { fetchFootballMatches } from '@/lib/football-api'
import { invalidateCache, CACHE_KEYS } from '@/lib/cache'
import { getKv } from '@/lib/db'

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  return runUpdate(actorId, actorName)
}

export async function runUpdate(actorId: string | null, actorName: string): Promise<NextResponse> {
  const db = getDb()
  const kv = getKv()

  const apiMatches = await fetchFootballMatches(kv)
  if (!apiMatches) {
    return NextResponse.json({ success: false, error: 'Football-API nicht erreichbar' }, { status: 503 })
  }

  let updated = 0

  for (const apiMatch of apiMatches) {
    if (apiMatch.status !== 'finished' || apiMatch.home_score === null || apiMatch.away_score === null) continue

    const existing = await queryOne<{ home_score: number | null }>(
      db, `SELECT home_score FROM matches WHERE id = ?`, [apiMatch.id]
    )
    if (!existing || existing.home_score !== null) continue

    await execute(
      db,
      `UPDATE matches SET home_score = ?, away_score = ?, status = 'finished', updated_at = datetime('now') WHERE id = ?`,
      [apiMatch.home_score, apiMatch.away_score, apiMatch.id]
    )
    updated++
  }

  if (updated > 0) {
    await rebuildLeaderboard()
    await invalidateCache(
      CACHE_KEYS.LEADERBOARD_ALL, CACHE_KEYS.LEADERBOARD_GROUPS,
      'cache:leaderboard:top5', CACHE_KEYS.MATCHES_UPCOMING,
    )
    await audit({ actorId, actorName, action: 'leaderboard.recalculated', details: { auto_updated: updated } })
  }

  // Prediction-Logs älter als 24h löschen — nur für Echtzeit-Aktivität gedacht
  await execute(
    db,
    `DELETE FROM audit_logs WHERE action IN ('prediction.created', 'prediction.updated') AND created_at < datetime('now', '-24 hours')`,
  )

  return NextResponse.json({ success: true, data: { updated } })
}
