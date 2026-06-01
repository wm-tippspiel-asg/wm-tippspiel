const COMPETITION_ID = '2000' // FIFA World Cup 2026
const API_BASE = 'https://api.football-data.org/v4'
const CACHE_KEY = 'wm2026_matches'
const CACHE_TTL = 300 // 5 minutes

export async function fetchFootballMatches(kv?: KVNamespace) {
  // Try cache first
  let cached = null
  if (kv) {
    cached = await kv.get(CACHE_KEY, 'json')
    if (cached) return cached
  }

  const token = process.env.FOOTBALL_API_KEY
  if (!token) throw new Error('FOOTBALL_API_KEY not set')

  try {
    const res = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}/matches`, {
      headers: { 'X-Auth-Token': token },
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = (await res.json()) as {
      matches: Array<{
        id: number
        utcDate: string
        status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED'
        homeTeam: { id: number; name: string; crest: string }
        awayTeam: { id: number; name: string; crest: string }
        score: { fullTime: { home: number | null; away: number | null } }
        group?: string
      }>
    }

    const matches = data.matches.map((m) => ({
      id: m.id,
      home_team: m.homeTeam.name,
      away_team: m.awayTeam.name,
      home_score: m.score.fullTime.home,
      away_score: m.score.fullTime.away,
      match_time: m.utcDate,
      status: mapStatus(m.status),
      group: m.group ?? null,
      external_id: m.id,
    }))

    if (kv) {
      await kv.put(CACHE_KEY, JSON.stringify(matches), { expirationTtl: CACHE_TTL })
    }
    return matches
  } catch (e) {
    console.error('Football API error:', e)
    return null
  }
}

function mapStatus(apiStatus: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    IN_PLAY: 'live',
    PAUSED: 'live',
    FINISHED: 'finished',
  }
  return map[apiStatus] ?? 'scheduled'
}

export async function fetchFootballStandings(kv?: KVNamespace) {
  const cacheKey = 'wm2026_standings'
  let cached = null
  if (kv) {
    cached = await kv.get(cacheKey, 'json')
    if (cached) return cached
  }

  const token = process.env.FOOTBALL_API_KEY
  if (!token) throw new Error('FOOTBALL_API_KEY not set')

  try {
    const res = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}/standings`, {
      headers: { 'X-Auth-Token': token },
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = (await res.json()) as {
      standings: Array<{
        stage: string
        group: string
        table: Array<{
          position: number
          team: { id: number; name: string; crest: string }
          playedGames: number
          won: number
          draw: number
          lost: number
          points: number
          goalsFor: number
          goalsAgainst: number
          goalDifference: number
        }>
      }>
    }

    const standings = data.standings
      .filter((s) => s.stage === 'GROUP_STAGE')
      .map((s) => ({
        group: s.group,
        teams: s.table.map((t) => ({
          position: t.position,
          name: t.team.name,
          crest: t.team.crest,
          played: t.playedGames,
          points: t.points,
          goalsFor: t.goalsFor,
          goalsAgainst: t.goalsAgainst,
          goalDiff: t.goalDifference,
        })),
      }))

    if (kv) {
      await kv.put(cacheKey, JSON.stringify(standings), { expirationTtl: CACHE_TTL })
    }
    return standings
  } catch (e) {
    console.error('Football API standings error:', e)
    return null
  }
}
