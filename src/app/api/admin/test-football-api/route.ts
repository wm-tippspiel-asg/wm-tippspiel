import { NextRequest, NextResponse } from 'next/server'
import { getApiKey } from '@/lib/db'
import { EN_TO_DE } from '@/lib/team-names'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const key = getApiKey()

  const keyInfo = {
    present: !!key,
    preview: key ? `${key.slice(0, 8)}...` : null,
    envSource: !!process.env.FOOTBALL_API_KEY ? 'process.env' : 'cloudflare_context',
  }

  if (!key) {
    return NextResponse.json({
      keyInfo,
      error: 'FOOTBALL_API_KEY ist nicht gesetzt',
      fix: 'Gehe zu Cloudflare Pages Dashboard → dein Projekt → Settings → Environment Variables → Production und setze FOOTBALL_API_KEY',
    }, { status: 500 })
  }

  try {
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': key } },
    )

    const rawBody = await res.text()

    let parsedInfo: {
      totalMatches: number
      finishedCount: number
      liveCount: number
      scheduledCount: number
      firstMatches: Array<{
        apiHome: string
        apiAway: string
        mappedHome: string
        mappedAway: string
        homeKnown: boolean
        awayKnown: boolean
        status: string
        score: string
      }>
      unknownTeams: string[]
    } | null = null

    if (res.ok) {
      try {
        const data = JSON.parse(rawBody) as {
          matches?: Array<{
            homeTeam?: { name?: string }
            awayTeam?: { name?: string }
            status?: string
            score?: { fullTime?: { home?: number | null; away?: number | null } }
          }>
        }

        if (Array.isArray(data.matches)) {
          const unknownSet = new Set<string>()
          const firstMatches = data.matches.slice(0, 20).map((m) => {
            const apiHome = m.homeTeam?.name ?? '?'
            const apiAway = m.awayTeam?.name ?? '?'
            const mappedHome = EN_TO_DE[apiHome] ?? apiHome
            const mappedAway = EN_TO_DE[apiAway] ?? apiAway
            const homeKnown = apiHome in EN_TO_DE
            const awayKnown = apiAway in EN_TO_DE
            if (!homeKnown && apiHome !== '?') unknownSet.add(apiHome)
            if (!awayKnown && apiAway !== '?') unknownSet.add(apiAway)
            const h = m.score?.fullTime?.home
            const a = m.score?.fullTime?.away
            return {
              apiHome, apiAway, mappedHome, mappedAway, homeKnown, awayKnown,
              status: m.status ?? '?',
              score: h != null && a != null ? `${h}:${a}` : '-:-',
            }
          })

          // Count unknown teams across all matches
          for (const m of data.matches) {
            const h = m.homeTeam?.name
            const a = m.awayTeam?.name
            if (h && !(h in EN_TO_DE)) unknownSet.add(h)
            if (a && !(a in EN_TO_DE)) unknownSet.add(a)
          }

          parsedInfo = {
            totalMatches: data.matches.length,
            finishedCount: data.matches.filter(m => m.status === 'FINISHED').length,
            liveCount: data.matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED').length,
            scheduledCount: data.matches.filter(m => m.status === 'TIMED' || m.status === 'SCHEDULED').length,
            firstMatches,
            unknownTeams: [...unknownSet],
          }
        }
      } catch (parseErr) {
        // parsedInfo stays null, raw body still returned
        console.error('test-football-api: failed to parse response', parseErr)
      }
    }

    return NextResponse.json({
      keyInfo,
      api: {
        status: res.status,
        ok: res.ok,
        rateLimitRemaining: res.headers.get('X-Requests-Available-Minute'),
        retryAfter: res.headers.get('Retry-After'),
        contentType: res.headers.get('Content-Type'),
      },
      parsedInfo,
      rawBody: rawBody.slice(0, 2000),
    })
  } catch (e) {
    return NextResponse.json({
      keyInfo,
      error: String(e),
      type: 'network_error',
      tip: 'Cloudflare Worker kann football-data.org nicht erreichen — prüfe ob fetch() Zugriff auf externe URLs erlaubt ist',
    }, { status: 500 })
  }
}
