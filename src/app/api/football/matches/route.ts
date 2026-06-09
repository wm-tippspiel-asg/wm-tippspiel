import { fetchFootballMatches } from '@/lib/football-api'
import { getKv } from '@/lib/db'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    let kv: KVNamespace | undefined
    try { kv = getKv() } catch { kv = undefined }
    const matches = await fetchFootballMatches(kv)

    if (!matches) {
      return Response.json({ success: false, error: 'Failed to fetch matches' }, { status: 503 })
    }

    return Response.json({ success: true, data: matches })
  } catch (e) {
    console.error('GET /api/football/matches:', e)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
