import { type NextRequest, NextResponse } from 'next/server'
import { runUpdate } from '@/app/api/admin/auto-update-scores/route'

export const runtime = 'edge'

// Called by Cloudflare Worker cron trigger
// Requires: Authorization: Bearer <CRON_SECRET>
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runUpdate(null, 'cron')
}
