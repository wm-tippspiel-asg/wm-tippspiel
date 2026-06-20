const API_BASE = 'https://api.football-data.org/v4'
const CACHE_TTL_DEFAULT = 900   // 15 min
const CACHE_TTL_THROTTLED = 300 // 5 min when rate limit is tight
const RATE_LIMIT_KV_KEY = 'football_rate_limit_until'

function buildHeaders(apiKey: string): Record<string, string> {
  return { 'X-Auth-Token': apiKey }
}

// Returns the TTL to use based on remaining requests this minute.
function ttlFromHeaders(res: Response): number {
  const available = parseInt(res.headers.get('X-Requests-Available-Minute') ?? '100', 10)
  if (available <= 2) return 3600
  if (available <= 5) return 600
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
  options?: { fresh?: boolean; skipRateLimit?: boolean; apiKey?: string },
): Promise<FootballMatch[] | null> {
  const apiKey = options?.apiKey ?? process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    console.error('Football API: FOOTBALL_API_KEY not configured')
    return null
  }

  const cacheKey = 'wm2026_matches'
  if (kv) {
    if (!options?.fresh) {
      const cached = await kv.get<FootballMatch[]>(cacheKey, 'json')
      if (cached) return cached
    }
    if (!options?.skipRateLimit && await isRateLimited(kv)) {
      console.warn('football-data.org: skipping — rate limited')
      return null
    }
  }

  try {
    const res = await fetch(
      `${API_BASE}/competitions/WC/matches?season=2026`,
      { headers: buildHeaders(apiKey) }
    )

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10)
      if (kv) await setRateLimited(kv, retryAfter)
      console.error(`Football API: 429 rate limited, retry after ${retryAfter}s`)
      return null
    }

    if (res.status === 403) {
      const body = await res.text()
      console.error(`Football API: 403 Forbidden — API key wrong or plan does not include WC 2026. Body: ${body.slice(0, 400)}`)
      return null
    }

    if (res.status === 404) {
      console.error('Football API: 404 — WC competition not found for season=2026')
      return null
    }

    if (!res.ok) {
      const body = await res.text()
      console.error(`Football API: HTTP ${res.status} error. Body: ${body.slice(0, 400)}`)
      return null
    }

    const data = (await res.json()) as {
      matches?: Array<{
        id: number
        utcDate: string
        status: string
        stage: string
        group: string | null
        homeTeam: { name: string }
        awayTeam: { name: string }
        score: {
          fullTime: { home: number | null; away: number | null }
          halfTime?: { home: number | null; away: number | null }
          regularTime?: { home: number | null; away: number | null }
        }
      }>
    }

    if (!Array.isArray(data.matches)) {
      console.error('Football API: response has no matches array', JSON.stringify(data).slice(0, 300))
      return null
    }

    const matches = data.matches.map((m) => ({
      id: m.id,
      home_team: m.homeTeam.name,
      away_team: m.awayTeam.name,
      // fullTime is null during live play — fall back to regularTime or halfTime
      home_score: m.score.fullTime.home ?? m.score.regularTime?.home ?? m.score.halfTime?.home ?? null,
      away_score: m.score.fullTime.away ?? m.score.regularTime?.away ?? m.score.halfTime?.away ?? null,
      match_time: m.utcDate,
      status: mapStatus(m.status),
      group: m.group,
      external_id: m.id,
    }))

    const ttl = ttlFromHeaders(res)
    if (kv) await kv.put(cacheKey, JSON.stringify(matches), { expirationTtl: ttl })
    return matches
  } catch (e) {
    console.error('Football API network/parse error:', e)
    return null
  }
}

// Called only by cron/admin — fetches from football-data.org and warms KV cache
export async function refreshFootballStandings(kv: KVNamespace, apiKey?: string): Promise<boolean> {
  const resolvedKey = apiKey ?? process.env.FOOTBALL_API_KEY
  if (!resolvedKey) {
    console.error('Football API standings: FOOTBALL_API_KEY not configured')
    return false
  }

  const cacheKey = 'wm2026_standings'
  const staleKey = 'wm2026_standings_stale'

  try {
    const res = await fetch(
      `${API_BASE}/competitions/WC/matches?season=2026`,
      { headers: buildHeaders(resolvedKey) }
    )

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10)
      await setRateLimited(kv, retryAfter)
      return false
    }

    if (!res.ok) {
      console.error(`Football API standings: HTTP ${res.status}`)
      return false
    }

    const data = (await res.json()) as {
      matches?: Array<{
        group: string | null
        status: string
        homeTeam: { id: number; name: string; crest: string }
        awayTeam: { id: number; name: string; crest: string }
        score: { fullTime: { home: number | null; away: number | null } }
      }>
    }

    if (!Array.isArray(data.matches)) return false

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
  return await kv.get<unknown[]>('wm2026_standings_stale', 'json')
}

function computeStandings(matches: Array<{
  group: string | null
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
