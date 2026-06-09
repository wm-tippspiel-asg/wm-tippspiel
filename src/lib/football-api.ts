const API_BASE = 'https://api.football-data.org/v4'
const CACHE_TTL = 900    // 15 minutes

function headers() {
  const key = process.env.FOOTBALL_API_KEY
  if (!key) throw new Error('FOOTBALL_API_KEY not set')
  return { 'X-Auth-Token': key }
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
      `${API_BASE}/competitions/WC/matches?season=2026`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = (await res.json()) as {
      matches: Array<{
        id: number
        utcDate: string
        status: string
        stage: string
        group: string | null
        homeTeam: { name: string }
        awayTeam: { name: string }
        score: {
          fullTime: { home: number | null; away: number | null }
        }
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
      group: m.group,
      external_id: m.id,
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
      `${API_BASE}/competitions/WC/matches?season=2026&stage=GROUP_STAGE`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = (await res.json()) as {
      matches: Array<{
        group: string
        status: string
        homeTeam: { id: number; name: string; crest: string }
        awayTeam: { id: number; name: string; crest: string }
        score: { fullTime: { home: number | null; away: number | null } }
      }>
    }

    const standings = computeStandings(data.matches)

    if (kv) await kv.put(cacheKey, JSON.stringify(standings), { expirationTtl: CACHE_TTL })
    return standings
  } catch (e) {
    console.error('Football API standings error:', e)
    return null
  }
}

function computeStandings(matches: Array<{
  group: string
  status: string
  homeTeam: { id: number; name: string; crest: string }
  awayTeam: { id: number; name: string; crest: string }
  score: { fullTime: { home: number | null; away: number | null } }
}>) {
  type TeamStats = {
    id: number; name: string; crest: string
    played: number; won: number; draw: number; lost: number
    goalsFor: number; goalsAgainst: number; points: number
  }

  const groupMap: Record<string, Record<number, TeamStats>> = {}

  for (const m of matches) {
    const group = m.group
    if (!group) continue

    if (!groupMap[group]) groupMap[group] = {}

    const ensureTeam = (team: { id: number; name: string; crest: string }): TeamStats => {
      if (!groupMap[group]![team.id]) {
        groupMap[group]![team.id] = {
          id: team.id, name: team.name, crest: team.crest,
          played: 0, won: 0, draw: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, points: 0,
        }
      }
      return groupMap[group]![team.id]!
    }

    const home = ensureTeam(m.homeTeam)
    const away = ensureTeam(m.awayTeam)

    const hg = m.score.fullTime.home
    const ag = m.score.fullTime.away
    if (m.status !== 'FINISHED' || hg === null || ag === null) continue

    home.played++; away.played++
    home.goalsFor += hg; home.goalsAgainst += ag
    away.goalsFor += ag; away.goalsAgainst += hg

    if (hg > ag) {
      home.won++; home.points += 3; away.lost++
    } else if (hg < ag) {
      away.won++; away.points += 3; home.lost++
    } else {
      home.draw++; home.points++; away.draw++; away.points++
    }
  }

  return Object.entries(groupMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, teamsMap]) => ({
      group,
      teams: Object.values(teamsMap)
        .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst))
        .map((t, i) => ({
          position: i + 1,
          name: t.name,
          crest: t.crest,
          played: t.played,
          points: t.points,
          goalsFor: t.goalsFor,
          goalsAgainst: t.goalsAgainst,
          goalDiff: t.goalsFor - t.goalsAgainst,
        })),
    }))
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    TIMED: 'scheduled',
    SCHEDULED: 'scheduled',
    IN_PLAY: 'live',
    PAUSED: 'live',
    FINISHED: 'finished',
    AWARDED: 'finished',
    POSTPONED: 'scheduled',
    CANCELLED: 'scheduled',
    SUSPENDED: 'scheduled',
  }
  return map[status] ?? 'scheduled'
}
