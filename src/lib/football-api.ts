const API_BASE = 'https://v3.football.api-sports.io'
const WC_LEAGUE_ID = 1   // FIFA World Cup
const WC_SEASON = 2026
const CACHE_TTL = 300    // 5 minutes

function headers() {
  const key = process.env.FOOTBALL_API_KEY
  if (!key) throw new Error('FOOTBALL_API_KEY not set')
  return { 'x-apisports-key': key }
}

export interface FootballMatch {
  id: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  match_time: string
  status: string
  group: string | null
  external_id: number
}

export async function fetchFootballMatches(kv?: KVNamespace): Promise<FootballMatch[] | null> {
  const cacheKey = 'wm2026_matches'
  if (kv) {
    const cached = await kv.get<FootballMatch[]>(cacheKey, 'json')
    if (cached) return cached
  }

  try {
    const res = await fetch(
      `${API_BASE}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = (await res.json()) as {
      response: Array<{
        fixture: { id: number; date: string; status: { short: string } }
        league: { round: string }
        teams: {
          home: { id: number; name: string; logo: string }
          away: { id: number; name: string; logo: string }
        }
        goals: { home: number | null; away: number | null }
      }>
    }

    const matches = data.response.map((m) => ({
      id: m.fixture.id,
      home_team: m.teams.home.name,
      away_team: m.teams.away.name,
      home_score: m.goals.home,
      away_score: m.goals.away,
      match_time: m.fixture.date,
      status: mapStatus(m.fixture.status.short),
      group: extractGroup(m.league.round),
      external_id: m.fixture.id,
    }))

    if (kv) await kv.put(cacheKey, JSON.stringify(matches), { expirationTtl: CACHE_TTL })
    return matches
  } catch (e) {
    console.error('Football API error:', e)
    return null
  }
}

export async function fetchFootballStandings(kv?: KVNamespace) {
  const cacheKey = 'wm2026_standings'
  if (kv) {
    const cached = await kv.get(cacheKey, 'json')
    if (cached) return cached
  }

  try {
    const res = await fetch(
      `${API_BASE}/standings?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = (await res.json()) as {
      response: Array<{
        league: {
          standings: Array<Array<{
            rank: number
            team: { id: number; name: string; logo: string }
            points: number
            goalsDiff: number
            group: string
            all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
          }>>
        }
      }>
    }

    const leagueData = data.response[0]?.league
    if (!leagueData) return []

    const standings = leagueData.standings.map((group) => ({
      group: group[0]?.group ?? '',
      teams: group.map((t) => ({
        position: t.rank,
        name: t.team.name,
        crest: t.team.logo,
        played: t.all.played,
        points: t.points,
        goalsFor: t.all.goals.for,
        goalsAgainst: t.all.goals.against,
        goalDiff: t.goalsDiff,
      })),
    }))

    if (kv) await kv.put(cacheKey, JSON.stringify(standings), { expirationTtl: CACHE_TTL })
    return standings
  } catch (e) {
    console.error('Football API standings error:', e)
    return null
  }
}

function mapStatus(short: string): string {
  const map: Record<string, string> = {
    NS: 'scheduled',
    TBD: 'scheduled',
    '1H': 'live',
    HT: 'live',
    '2H': 'live',
    ET: 'live',
    P: 'live',
    FT: 'finished',
    AET: 'finished',
    PEN: 'finished',
    PST: 'scheduled',
    CANC: 'scheduled',
  }
  return map[short] ?? 'scheduled'
}

function extractGroup(round: string): string | null {
  // e.g. "Group Stage - 1" or "Group A"
  const match = round.match(/Group\s+([A-Z])/i)
  if (match?.[1]) return `GROUP_${match[1].toUpperCase()}`
  if (round.toLowerCase().includes('group')) return round
  return null
}
