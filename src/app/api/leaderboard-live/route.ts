import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, queryOne } from '@/lib/db'
import { getCached, setCached } from '@/lib/cache'
import type { Match, Prediction } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const db = getDb()
  
  // Cache live data for 10s to reduce request load
  const cached = await getCached<{
    liveMatch: Match | null
    predictions: Prediction[]
  }>('cache:leaderboard:live')
  
  if (cached) {
    return NextResponse.json({ success: true, data: cached })
  }

  // Fetch live match (if any)
  const liveMatches = await queryAll<Match>(
    db,
    `SELECT * FROM matches WHERE status = 'live' LIMIT 1`
  )
  
  const liveMatch = liveMatches[0] ?? null

  let predictions: Prediction[] = []
  
  // Only fetch predictions if there's a live match
  if (liveMatch) {
    predictions = await queryAll<Prediction>(
      db,
      `SELECT * FROM predictions WHERE match_id = ?`,
      [liveMatch.id]
    )
  }

  const result = { liveMatch, predictions }
  
  // Cache for 10 seconds to reduce load
  await setCached('cache:leaderboard:live', result, 10)
  
  return NextResponse.json({ success: true, data: result })
}
