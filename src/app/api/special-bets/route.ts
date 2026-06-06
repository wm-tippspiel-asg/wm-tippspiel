import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, execute, queryOne } from '@/lib/db'

export const runtime = 'edge'

const DEADLINE = new Date('2026-06-11T19:00:00Z')

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const db = getDb()
  const bets = await queryAll<{ bet_type: string; prediction: string }>(
    db, `SELECT bet_type, prediction FROM special_bets WHERE user_id = ?`, [user.id]
  )

  return Response.json({ success: true, data: bets })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  if (new Date() >= DEADLINE) {
    return Response.json({ success: false, error: 'Die Tipps sind gesperrt. Die WM hat begonnen!' }, { status: 400 })
  }

  const body = await request.json() as { bet_type?: string; prediction?: string }
  const { bet_type, prediction } = body

  if (!bet_type || !['winner', 'top_scorer'].includes(bet_type)) {
    return Response.json({ success: false, error: 'Ungültiger Tipp-Typ.' }, { status: 400 })
  }
  if (!prediction || prediction.trim().length === 0) {
    return Response.json({ success: false, error: 'Bitte gib eine Antwort ein.' }, { status: 400 })
  }
  if (prediction.trim().length > 100) {
    return Response.json({ success: false, error: 'Antwort darf maximal 100 Zeichen lang sein.' }, { status: 400 })
  }

  const db = getDb()
  await execute(db,
    `INSERT INTO special_bets (user_id, bet_type, prediction)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, bet_type) DO UPDATE SET prediction = excluded.prediction, updated_at = datetime('now')`,
    [user.id, bet_type, prediction.trim()]
  )

  return Response.json({ success: true })
}
