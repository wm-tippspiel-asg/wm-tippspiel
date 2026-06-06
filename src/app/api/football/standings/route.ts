import { fetchFootballStandings } from '@/lib/football-api'
import { getKv } from '@/lib/db'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const standings = await fetchFootballStandings(getKv())

    if (!standings) {
      return Response.json({ success: false, error: 'Failed to fetch standings' }, { status: 503 })
    }

    return Response.json({ success: true, data: standings })
  } catch (e) {
    console.error('GET /api/football/standings:', e)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
