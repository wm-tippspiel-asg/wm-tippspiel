import { fetchFootballMatches } from '@/lib/football-api'
import { getKv } from '@/lib/db'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const matches = await fetchFootballMatches(getKv())

    if (!matches) {
      return Response.json({ success: false, error: 'Failed to fetch matches' }, { status: 503 })
    }

    return Response.json({ success: true, data: matches })
  } catch (e) {
    console.error('GET /api/football/matches:', e)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
