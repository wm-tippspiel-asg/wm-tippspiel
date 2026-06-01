import { getCurrentUser } from '@/lib/auth'
import { getDb, queryOne, queryAll, execute } from '@/lib/db'
import { recalculateLeaderboard } from '@/lib/scoring'
import { fetchFootballMatches } from '@/lib/football-api'
import { logAudit } from '@/lib/audit'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const kv = (globalThis as any).RATE_LIMIT as KVNamespace

    // Fetch latest from API
    const apiMatches = await fetchFootballMatches(kv)
    if (!apiMatches) {
      return Response.json({ success: false, error: 'Failed to fetch from API' }, { status: 503 })
    }

    let updated = 0

    // Check each match
    for (const apiMatch of apiMatches) {
      if (apiMatch.status !== 'finished' || apiMatch.home_score === null) continue

      // Check if we already have this result
      const existing = await queryOne<{ home_score: number | null }>(
        db,
        `SELECT home_score FROM matches WHERE id = ?`,
        [apiMatch.id]
      )

      // Only insert if we don't have a result yet
      if (existing && existing.home_score === null) {
        await execute(db,
          `UPDATE matches SET home_score = ?, away_score = ?, status = 'finished'
           WHERE id = ?`,
          [apiMatch.home_score, apiMatch.away_score, apiMatch.id]
        )
        updated++
      }
    }

    // Recalculate leaderboard if any matches were updated
    if (updated > 0) {
      await recalculateLeaderboard(db)
      await logAudit(db, user.id, 'AUTO_SCORE_UPDATE', `Updated ${updated} match results from API`)
    }

    return Response.json({ success: true, data: { updated } })
  } catch (e) {
    console.error('POST /api/admin/auto-update-scores:', e)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
