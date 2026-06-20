import { NextRequest, NextResponse } from 'next/server'
import { getDb, getKv, getApiKey, queryOne, execute } from '@/lib/db'
import { rebuildLeaderboard, recalculateMatchPoints } from '@/lib/scoring'
import { audit } from '@/lib/audit'
import { fetchFootballMatches, refreshFootballStandings } from '@/lib/football-api'
import { invalidateCache, CACHE_KEYS } from '@/lib/cache'
import { toGermanTeam } from '@/lib/team-names'

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
  let kv: KVNamespace | undefined
  try { kv = getKv() } catch { kv = undefined }

  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'FOOTBALL_API_KEY nicht gesetzt — trage ihn in den Cloudflare Pages Environment Variables (Production) ein',
    }, { status: 503 })
  }

  // Always fetch fresh data; skipRateLimit so cron always tries regardless of cached limit flag
  const apiMatches = await fetchFootballMatches(kv, { fresh: true, skipRateLimit: true, apiKey })
  if (!apiMatches) {
    return NextResponse.json({
      success: false,
      error: 'Football-API nicht erreichbar — prüfe die Cloudflare Worker Logs für den genauen HTTP-Status (403/404/429/Netzwerkfehler)',
    }, { status: 503 })
  }

  let updated = 0
  let liveUpdated = 0
  let pointsRecalculated = 0
  let skippedScheduled = 0
  const unmatchedTeams: string[] = []

  for (const apiMatch of apiMatches) {
    if (apiMatch.status === 'scheduled') {
      skippedScheduled++
      continue
    }

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
      unmatchedTeams.push(`${apiMatch.home_team} vs ${apiMatch.away_team} → ${homeDe} vs ${awayDe}`)
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

  // Warm standings cache
  if (kv) await refreshFootballStandings(kv, apiKey)

  return NextResponse.json({
    success: true,
    data: { updated, liveUpdated, pointsRecalculated, skippedScheduled, unmatched: unmatchedTeams.length, unmatchedTeams },
  })
}
