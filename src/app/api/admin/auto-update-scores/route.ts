import { NextRequest, NextResponse } from 'next/server'
import { getDb, getKv, queryOne, execute } from '@/lib/db'
import { rebuildLeaderboard, recalculateMatchPoints } from '@/lib/scoring'
import { audit } from '@/lib/audit'
import { fetchFootballMatches, refreshFootballStandings } from '@/lib/football-api'
import { invalidateCache, CACHE_KEYS } from '@/lib/cache'

export const runtime = 'edge'

// Maps football-data.org English team names → German names stored in DB
// Includes common API variants (FIFA names, old/new spellings)
const EN_TO_DE: Record<string, string> = {
  'Algeria': 'Algerien',
  'Argentina': 'Argentinien',
  'Australia': 'Australien',
  'Austria': 'Österreich',
  'Belgium': 'Belgien',
  'Bosnia-Herzegovina': 'Bosnien-Herzegowina',
  'Bosnia and Herzegovina': 'Bosnien-Herzegowina',
  'Bosnia Herzegovina': 'Bosnien-Herzegowina',
  'Brazil': 'Brasilien',
  'Cabo Verde': 'Kap Verde',
  'Canada': 'Kanada',
  'Cape Verde': 'Kap Verde',
  'Cape Verde Islands': 'Kap Verde',
  'Colombia': 'Kolumbien',
  'Congo DR': 'DR Kongo',
  'DR Congo': 'DR Kongo',
  'Croatia': 'Kroatien',
  'Curaçao': 'Curaçao',
  'Czech Republic': 'Tschechien',
  'Czechia': 'Tschechien',
  "Côte d'Ivoire": 'Elfenbeinküste',
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
  'Korea Republic': 'Südkorea',
  'Republic of Korea': 'Südkorea',
  'South Korea': 'Südkorea',
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
  'Spain': 'Spanien',
  'Sweden': 'Schweden',
  'Switzerland': 'Schweiz',
  'Tunisia': 'Tunesien',
  'Turkey': 'Türkei',
  'Türkiye': 'Türkei',
  'United States': 'USA',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Usbekistan',
}

function toGermanTeam(name: string): string {
  return EN_TO_DE[name] ?? name
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

  // Always fetch fresh data — cron runs every 5 min, cache TTL is 15 min
  // skipRateLimit: admin trigger should always try the API regardless of rate-limit flag
  const apiMatches = await fetchFootballMatches(kv, { fresh: true, skipRateLimit: true })
  if (!apiMatches) {
    const hasKey = !!process.env.FOOTBALL_API_KEY
    return NextResponse.json({
      success: false,
      error: hasKey ? 'Football-API nicht erreichbar (Netzwerkfehler oder 429)' : 'FOOTBALL_API_KEY nicht gesetzt',
    }, { status: 503 })
  }

  let updated = 0
  let liveUpdated = 0
  let pointsRecalculated = 0
  let unmatched = 0

  for (const apiMatch of apiMatches) {
    if (apiMatch.status === 'scheduled') continue

    const homeDe = toGermanTeam(apiMatch.home_team)
    const awayDe = toGermanTeam(apiMatch.away_team)

    const existing = await queryOne<{
      id: string
      home_score: number | null
      away_score: number | null
      status: string
    }>(
      db,
      `SELECT id, home_score, away_score, status FROM matches WHERE home_team = ? AND away_team = ?`,
      [homeDe, awayDe],
    )
    if (!existing) {
      unmatched++
      continue
    }

    const targetStatus = apiMatch.status === 'finished' ? 'finished' : 'live'
    const scoresAvailable = apiMatch.home_score !== null && apiMatch.away_score !== null
    const scoresChanged =
      scoresAvailable &&
      (existing.home_score !== apiMatch.home_score || existing.away_score !== apiMatch.away_score)
    const statusChanged = existing.status !== targetStatus

    if (!scoresChanged && !statusChanged) continue

    if (scoresAvailable) {
      await execute(
        db,
        `UPDATE matches SET home_score = ?, away_score = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
        [apiMatch.home_score, apiMatch.away_score, targetStatus, existing.id],
      )
    } else {
      // Match is live but fullTime scores not yet available — update status only
      await execute(
        db,
        `UPDATE matches SET status = ?, updated_at = datetime('now') WHERE id = ?`,
        [targetStatus, existing.id],
      )
    }

    if (scoresChanged) {
      await recalculateMatchPoints(existing.id, { skipRebuild: true })
      pointsRecalculated++
    }

    if (targetStatus === 'live') liveUpdated++
    else updated++
  }

  if (pointsRecalculated > 0) {
    await rebuildLeaderboard()
    await audit({
      actorId,
      actorName,
      action: 'leaderboard.recalculated',
      details: { auto_updated: updated, live_updated: liveUpdated, points_recalculated: pointsRecalculated },
    })
  }

  if (updated > 0 || liveUpdated > 0) {
    await invalidateCache(
      CACHE_KEYS.LEADERBOARD_ALL,
      CACHE_KEYS.LEADERBOARD_GROUPS,
      'cache:leaderboard:top5',
      'cache:leaderboard:ranking',
      'cache:leaderboard:live',
      CACHE_KEYS.MATCHES_UPCOMING,
    )
  }

  await execute(
    db,
    `DELETE FROM audit_logs WHERE action IN ('prediction.created', 'prediction.updated') AND created_at < datetime('now', '-24 hours')`,
  )

  // Warm the standings cache so user page-loads never hit the API directly
  if (kv) await refreshFootballStandings(kv)

  return NextResponse.json({
    success: true,
    data: { updated, liveUpdated, pointsRecalculated, unmatched },
  })
}
