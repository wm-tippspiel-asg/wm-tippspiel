import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const key = process.env.FOOTBALL_API_KEY
  if (!key) return NextResponse.json({ error: 'FOOTBALL_API_KEY nicht gesetzt' }, { status: 500 })

  try {
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': key } },
    )
    const body = await res.text()
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      headers: {
        'X-Requests-Available-Minute': res.headers.get('X-Requests-Available-Minute'),
        'Retry-After': res.headers.get('Retry-After'),
        'Content-Type': res.headers.get('Content-Type'),
      },
      body: body.slice(0, 500),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
