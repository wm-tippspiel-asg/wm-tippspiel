import { NextRequest, NextResponse } from 'next/server'
import { getDb, getKv, queryOne, execute } from '@/lib/db'
import { rebuildLeaderboard } from '@/lib/scoring'
import { audit } from '@/lib/audit'
import { fetchFootballMatches } from '@/lib/football-api'
import { invalidateCache, CACHE_KEYS } from '@/lib/cache'

export const runtime = 'edge'

// Maps football-data.org English team names → German names stored in DB
const EN_TO_DE: Record<string, string> = {
  'Algeria': 'Algerien',
  'Argentina': 'Argentinien',
  'Australia': 'Australien',
  'Austria': 'Österreich',
  'Belgium': 'Belgien',
  'Bosnia-Herzegovina': 'Bosnien-Herzegowina',
  'Brazil': 'Brasilien',
  'Canada': 'Kanada',
  'Cape Verde Islands': 'Kap Verde',
  'Colombia': 'Kolumbien',
  'Congo DR': 'DR Kongo',
  'Croatia': 'Kroatien',
  'Curaçao': 'Curaçao',
  'Czechia': 'Tschechien',
  'Ecuador': 'Ecuador',
  'Egypt': 'Ägypten',
  'England': 'England',
  'France': 'Frankreich',
  'Germany': 'Deutschland',
  'Ghana': 'Ghana',
  'Haiti': 'Haiti',
  'Iran': 'Iran',
  'Iraq': 'Irak',
  'Ivory Coast': 'Elfenbeinküste',
  'Japan': 'Japan',
  'Jordan': 'Jordanien',
  'Mexico': 'Mexiko',
  'Morocco': 'Marokko',
  'Netherlands': 'Niederlande',
  'New Zealand': 'Neuseeland',
  'Norway': 'Norwegen',
  'Panama': 'Panama',
  'Paraguay': 'Paraguay',
  'Portugal': 'Portugal',
  'Qatar': 'Katar',
  'Saudi Arabia': 'Saudi-Arabien',
  'Scotland': 'Schottland',
  'Senegal': 'Senegal',
  'South Africa': 'Südafrika',
  'South Korea': 'Südkorea',
  'Spain': 'Spanien',
  'Sweden': 'Schweden',
  'Switzerland': 'Schweiz',
  'Tunisia': 'Tunesien',
  'Turkey': 'Türkei',
  'United States': 'USA',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Usbekistan',
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  return runUpdate(actorId, actorName)
}

export async function runUpdate(actorId: string | null, actorName: string): Promise<NextResponse> {
  const db = getDb()
  let kv: KVNamespace | undefined
  try { kv = getKv() } catch { kv = undefined }

  const apiMatches = await fetchFootballMatches(kv)
  if (!apiMatches) {
    return NextResponse.json({ success: false, error: 'Football-API nicht erreichbar' }, { status: 503 })
  }

  let updated = 0
  let liveUpdated = 0

  for (const apiMatch of apiMatches) {
    if (apiMatch.status === 'scheduled') continue

    const homeDe = EN_TO_DE[apiMatch.home_team] ?? apiMatch.home_team
    const existing = await queryOne<{ id: string; home_score: number | null; status: string }>(
      db,
      `SELECT id, home_score, status FROM matches WHERE match_time = ? AND home_team = ?`,
      [apiMatch.match_time, homeDe]
    )
    if (!existing) continue

    if (apiMatch.status === 'live' && existing.status !== 'live') {
      await execute(
        db,
        `UPDATE matches SET status = 'live', updated_at = datetime('now') WHERE id = ?`,
        [existing.id]
      )
      liveUpdated++
    }

    if (apiMatch.status === 'finished' && apiMatch.home_score !== null && apiMatch.away_score !== null && existing.home_score === null) {
      await execute(
        db,
        `UPDATE matches SET home_score = ?, away_score = ?, status = 'finished', updated_at = datetime('now') WHERE id = ?`,
        [apiMatch.home_score, apiMatch.away_score, existing.id]
      )
      updated++
    }
  }

  if (updated > 0) {
    await rebuildLeaderboard()
    await audit({ actorId, actorName, action: 'leaderboard.recalculated', details: { auto_updated: updated } })
  }

  if (updated > 0 || liveUpdated > 0) {
    await invalidateCache(
      CACHE_KEYS.LEADERBOARD_ALL, CACHE_KEYS.LEADERBOARD_GROUPS,
      'cache:leaderboard:top5', CACHE_KEYS.MATCHES_UPCOMING,
    )
  }

  await execute(
    db,
    `DELETE FROM audit_logs WHERE action IN ('prediction.created', 'prediction.updated') AND created_at < datetime('now', '-24 hours')`,
  )

  return NextResponse.json({ success: true, data: { updated, liveUpdated } })
}
