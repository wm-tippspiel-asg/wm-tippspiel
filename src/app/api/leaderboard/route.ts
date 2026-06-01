import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll } from '@/lib/db'
import type { LeaderboardEntry } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const db = getDb()

  const entries = await queryAll<LeaderboardEntry>(
    db,
    `SELECT * FROM leaderboard ORDER BY total_points DESC, exact_results DESC, username ASC`,
  )

  // Ensure all users are present (even if they have no predictions)
  // by inserting fresh users not yet in leaderboard
  if (entries.length === 0) {
    return NextResponse.json({ success: true, data: { entries: [], currentUserId: userId } })
  }

  return NextResponse.json({ success: true, data: { entries, currentUserId: userId } })
}
