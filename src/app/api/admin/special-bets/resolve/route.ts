import { getCurrentUser } from '@/lib/auth'
import { getDb, queryAll, queryOne, execute } from '@/lib/db'
import { audit } from '@/lib/audit'
import { invalidateCache, CACHE_KEYS } from '@/lib/cache'

export const runtime = 'edge'

async function getPointsConfig(db: D1Database, bet_type: string): Promise<number> {
  const configKey = bet_type === 'winner' ? 'special_winner' : 'special_top_scorer'
  const config = await queryOne<{ value: number }>(db,
    `SELECT value FROM scoring_config WHERE key = ?`, [configKey]
  )
  return config?.value ?? (bet_type === 'winner' ? 20 : 15)
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return Response.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })
  }

  const body = await request.json() as
    | { bet_type: string; result: string; user_ids?: never }
    | { bet_type: string; user_ids: string[]; result?: never }

  const { bet_type } = body
  if (!bet_type || !['winner', 'top_scorer'].includes(bet_type)) {
    return Response.json({ success: false, error: 'Ungültiger Typ' }, { status: 400 })
  }

  const db = getDb()
  const points = await getPointsConfig(db, bet_type)

  // --- Manuelle Vergabe an bestimmte User-IDs ---
  if (body.user_ids) {
    const { user_ids } = body
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return Response.json({ success: false, error: 'Keine User-IDs angegeben' }, { status: 400 })
    }

    let awarded = 0
    for (const uid of user_ids) {
      // Nur vergeben wenn noch keine Punkte erhalten
      const bet = await queryOne<{ points_awarded: number }>(db,
        `SELECT points_awarded FROM special_bets WHERE user_id = ? AND bet_type = ?`, [uid, bet_type]
      )
      if (!bet || bet.points_awarded > 0) continue

      await execute(db,
        `UPDATE leaderboard SET total_points = total_points + ? WHERE user_id = ?`,
        [points, uid]
      )
      await execute(db,
        `UPDATE special_bets SET points_awarded = ? WHERE user_id = ? AND bet_type = ?`,
        [points, uid, bet_type]
      )
      awarded++
    }

    await invalidateCache(CACHE_KEYS.LEADERBOARD_ALL, CACHE_KEYS.LEADERBOARD_GROUPS, 'cache:leaderboard:top5')
    await audit({
      actorId: user.id, actorName: user.username,
      action: 'leaderboard.recalculated',
      details: { bet_type, manual: true, points_awarded: points, users_awarded: awarded },
    })
    return Response.json({ success: true, data: { awarded, points } })
  }

  // --- Automatische Vergabe per String-Vergleich ---
  const { result } = body
  if (!result?.trim()) {
    return Response.json({ success: false, error: 'Kein Ergebnis angegeben' }, { status: 400 })
  }

  await execute(db,
    `INSERT INTO special_bets_results (bet_type, result)
     VALUES (?, ?)
     ON CONFLICT(bet_type) DO UPDATE SET result = excluded.result, resolved_at = datetime('now')`,
    [bet_type, result.trim()]
  )

  const allBets = await queryAll<{ user_id: string; prediction: string; points_awarded: number }>(db,
    `SELECT user_id, prediction, points_awarded FROM special_bets WHERE bet_type = ?`, [bet_type]
  )

  let awarded = 0
  for (const bet of allBets) {
    if (bet.points_awarded > 0) continue
    if (bet.prediction.trim().toLowerCase() !== result.trim().toLowerCase()) continue

    await execute(db,
      `UPDATE leaderboard SET total_points = total_points + ? WHERE user_id = ?`,
      [points, bet.user_id]
    )
    await execute(db,
      `UPDATE special_bets SET points_awarded = ? WHERE user_id = ? AND bet_type = ?`,
      [points, bet.user_id, bet_type]
    )
    awarded++
  }

  await invalidateCache(CACHE_KEYS.LEADERBOARD_ALL, CACHE_KEYS.LEADERBOARD_GROUPS, 'cache:leaderboard:top5')
  await audit({
    actorId: user.id, actorName: user.username,
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

  const stats = await queryAll<{ bet_type: string; prediction: string; count: number }>(db,
    `SELECT bet_type, prediction, COUNT(*) as count
     FROM special_bets GROUP BY bet_type, prediction ORDER BY count DESC`
  )

  const userBets = await queryAll<{
    user_id: string; username: string; bet_type: string; prediction: string; points_awarded: number
  }>(db,
    `SELECT sb.user_id, u.username, sb.bet_type, sb.prediction, sb.points_awarded
     FROM special_bets sb
     JOIN users u ON u.id = sb.user_id
     ORDER BY sb.bet_type, u.username ASC`
  )

  return Response.json({ success: true, data: { results, stats, userBets } })
}
