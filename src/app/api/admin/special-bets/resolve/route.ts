import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne, execute } from '@/lib/db'
import { audit } from '@/lib/audit'
import { invalidateCache, CACHE_KEYS } from '@/lib/cache'

export const runtime = 'edge'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return Response.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })
  }

  const body = await request.json() as { bet_type: string; result: string }
  const { bet_type, result } = body

  if (!bet_type || !['winner', 'top_scorer'].includes(bet_type)) {
    return Response.json({ success: false, error: 'Ungültiger Typ' }, { status: 400 })
  }
  if (!result?.trim()) {
    return Response.json({ success: false, error: 'Kein Ergebnis angegeben' }, { status: 400 })
  }

  const db = getDb()

  // Save official result
  await execute(db,
    `INSERT INTO special_bets_results (bet_type, result)
     VALUES (?, ?)
     ON CONFLICT(bet_type) DO UPDATE SET result = excluded.result, resolved_at = datetime('now')`,
    [bet_type, result.trim()]
  )

  // Get points config
  const configKey = bet_type === 'winner' ? 'special_winner' : 'special_top_scorer'
  const config = await queryOne<{ value: number }>(db,
    `SELECT value FROM scoring_config WHERE key = ?`, [configKey]
  )
  const points = config?.value ?? (bet_type === 'winner' ? 20 : 15)

  // Find all users who got it right and award points
  const correct = await queryAll<{ user_id: string; prediction: string }>(db,
    `SELECT user_id, prediction FROM special_bets WHERE bet_type = ?`, [bet_type]
  )

  let awarded = 0
  for (const bet of correct) {
    if (bet.prediction.trim().toLowerCase() === result.trim().toLowerCase()) {
      // Add points to leaderboard
      await execute(db,
        `UPDATE leaderboard SET total_points = total_points + ? WHERE user_id = ?`,
        [points, bet.user_id]
      )
      awarded++
    }
  }

  // Ranglisten-Caches leeren, damit die neuen Punkte sofort sichtbar sind
  // (Sondertipp-Punkte fließen über die persönliche Wertung auch in die Klassenwertung)
  await invalidateCache(CACHE_KEYS.LEADERBOARD_ALL, CACHE_KEYS.LEADERBOARD_GROUPS, 'cache:leaderboard:top5')

  await audit({
    actorId: user.id,
    actorName: user.username,
    action: 'leaderboard.recalculated',
    details: { bet_type, result, points_awarded: points, users_awarded: awarded },
  })

  return Response.json({ success: true, data: { awarded, points } })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return Response.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })
  }

  const db = getDb()
  const results = await queryAll<{ bet_type: string; result: string; resolved_at: string }>(
    db, `SELECT * FROM special_bets_results`
  )

  // Count bets per type
  const stats = await queryAll<{ bet_type: string; prediction: string; count: number }>(db,
    `SELECT bet_type, prediction, COUNT(*) as count FROM special_bets GROUP BY bet_type, prediction ORDER BY count DESC`
  )

  return Response.json({ success: true, data: { results, stats } })
}
