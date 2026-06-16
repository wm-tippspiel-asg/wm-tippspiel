const API_BASE = 'https://api.football-data.org/v4'
const CACHE_TTL_DEFAULT = 900   // 15 min
const CACHE_TTL_THROTTLED = 300 // 5 min when rate limit is tight
const RATE_LIMIT_KV_KEY = 'football_rate_limit_until'

function headers() {
  const key = process.env.FOOTBALL_API_KEY
  if (!key) throw new Error('FOOTBALL_API_KEY not set')
  return { 'X-Auth-Token': key }
}

// Returns the TTL to use based on remaining requests this minute.
// Extends cache when quota is low to avoid burning the limit.
function ttlFromHeaders(res: Response): number {
  const available = parseInt(res.headers.get('X-Requests-Available-Minute') ?? '100', 10)
  if (available <= 2) return 3600   // 1 h — almost exhausted
  if (available <= 5) return 600    // 10 min — getting tight
  if (available <= 10) return CACHE_TTL_THROTTLED
  return CACHE_TTL_DEFAULT
}

async function isRateLimited(kv: KVNamespace): Promise<boolean> {
  const until = await kv.get(RATE_LIMIT_KV_KEY)
  if (!until) return false
  return Date.now() < parseInt(until, 10)
}

async function setRateLimited(kv: KVNamespace, retryAfterSeconds: number) {
  const until = Date.now() + retryAfterSeconds * 1000
  await kv.put(RATE_LIMIT_KV_KEY, String(until), { expirationTtl: retryAfterSeconds + 10 })
  console.warn(`football-data.org: rate limited for ${retryAfterSeconds}s`)
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

export async function fetchFootballMatches(
  kv?: KVNamespace,
  options?: { fresh?: boolean; skipRateLimit?: boolean },
): Promise<FootballMatch[] | null> {
  const cacheKey = 'wm2026_matches'
  if (kv) {
    if (!options?.fresh) {
      const cached = await kv.get<FootballMatch[]>(cacheKey, 'json')
      if (cached) return cached
    }
    if (!options?.skipRateLimit && await isRateLimited(kv)) {
      console.warn('football-data.org: rate limited, skipping request')
      return null
    }
  }

  try {
    const res = await fetch(
      `${API_BASE}/competitions/WC/matches?season=2026`,
      { headers: headers() }
    )

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10)
      if (kv) await setRateLimited(kv, retryAfter)
      return null
    }

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

    const ttl = ttlFromHeaders(res)
    if (kv) await kv.put(cacheKey, JSON.stringify(matches), { expirationTtl: ttl })
    return matches
  } catch (e) {
    console.error('Football API error:', e)
    return null
  }
}

// Called only by cron/admin — actually fetches from football-data.org and warms KV cache
export async function refreshFootballStandings(kv: KVNamespace): Promise<boolean> {
  const cacheKey = 'wm2026_standings'
  const staleKey = 'wm2026_standings_stale'

  try {
    const res = await fetch(
      `${API_BASE}/competitions/WC/matches?season=2026&stage=GROUP_STAGE`,
      { headers: headers() }
    )

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10)
      await setRateLimited(kv, retryAfter)
      return false
    }

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
    if (standings.length > 0) {
      const ttl = ttlFromHeaders(res)
      await Promise.all([
        kv.put(cacheKey, JSON.stringify(standings), { expirationTtl: ttl }),
        kv.put(staleKey, JSON.stringify(standings)),
      ])
    }
    return standings.length > 0
  } catch (e) {
    console.error('Football API standings error:', e)
    return false
  }
}

// Called by user-facing pages — reads only from KV, never calls the API
export async function fetchFootballStandings(kv?: KVNamespace) {
  if (!kv) return null
  const cached = await kv.get<unknown[]>('wm2026_standings', 'json')
  if (cached && cached.length > 0) return cached
  // Fall back to permanent stale cache (populated by cron)
  return await kv.get<unknown[]>('wm2026_standings_stale', 'json')
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
    .sort(([a], [b]) => {
      const suffix = (s: string) => s.replace('GROUP_', '')
      const sA = suffix(a), sB = suffix(b)
      const nA = parseInt(sA, 10), nB = parseInt(sB, 10)
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB
      return sA.localeCompare(sB)
    })
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
