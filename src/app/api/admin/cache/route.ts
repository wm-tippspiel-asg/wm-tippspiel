import { NextRequest, NextResponse } from 'next/server'
import { getKv } from '@/lib/db'

export const runtime = 'edge'

const FOOTBALL_KV_KEYS = ['wm2026_standings', 'wm2026_matches', 'football_rate_limit_until']

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  let kv: KVNamespace | undefined
  try { kv = getKv() } catch {
    return NextResponse.json({ success: false, error: 'KV nicht verfügbar' }, { status: 503 })
  }

  const key = new URL(request.url).searchParams.get('key')
  const keys = key ? [key] : FOOTBALL_KV_KEYS

  const deleted: string[] = []
  for (const k of keys) {
    await kv.delete(k)
    deleted.push(k)
  }

  return NextResponse.json({ success: true, deleted })
}
