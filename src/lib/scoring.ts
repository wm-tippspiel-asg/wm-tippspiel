import { getDb, queryOne, queryAll, execute } from './db'
import type { ScoringConfig } from '@/types'

// Default scoring — overridden by DB config
const DEFAULT_SCORING: ScoringConfig = {
  exact_result: 5,
  correct_diff_and_winner: 3,
  correct_winner: 2,
}

export async function getScoringConfig(): Promise<ScoringConfig> {
  try {
    const db = getDb()
    const rows = await queryAll<{ key: string; value: number }>(
      db,
      'SELECT key, value FROM scoring_config',
    )
    const config = { ...DEFAULT_SCORING }
    for (const row of rows) {
      if (row.key in config) {
        (config as Record<string, number>)[row.key] = row.value
      }
    }
    return config
  } catch {
    return DEFAULT_SCORING
  }
}

export function calculatePoints(
  predicted_home: number,
  predicted_away: number,
  actual_home: number,
  actual_away: number,
  scoring: ScoringConfig,
): number {
  // Exact result
  if (predicted_home === actual_home && predicted_away === actual_away) {
    return scoring.exact_result
  }

  const predictedDiff = predicted_home - predicted_away
  const actualDiff = actual_home - actual_away

  const predictedWinner = Math.sign(predictedDiff)
  const actualWinner = Math.sign(actualDiff)

  // Correct difference AND correct winner/draw
  if (predictedDiff === actualDiff && predictedWinner === actualWinner) {
    return scoring.correct_diff_and_winner
  }

  // Correct winner/draw only
  if (predictedWinner === actualWinner) {
    return scoring.correct_winner
  }

  return 0
}

// Recalculate all points after a match result is set
export async function recalculateMatchPoints(matchId: string): Promise<void> {
  const db = getDb()

  const match = await queryOne<{
    home_score: number | null
    away_score: number | null
    status: string
  }>(db, 'SELECT home_score, away_score, status FROM matches WHERE id = ?', [matchId])

  if (!match || match.home_score === null || match.away_score === null) {
    return
  }
  
  // Recalculate for both 'finished' and 'live' matches if they have scores
  if (match.status !== 'finished' && match.status !== 'live') {
    return
  }

  const scoring = await getScoringConfig()

  const predictions = await queryAll<{
    id: string
    user_id: string
    home_score: number
    away_score: number
  }>(db, 'SELECT id, user_id, home_score, away_score FROM predictions WHERE match_id = ?', [matchId])

  for (const pred of predictions) {
    const points = calculatePoints(pred.home_score, pred.away_score, match.home_score, match.away_score, scoring)
    await execute(db, `UPDATE predictions SET points = ?, updated_at = datetime('now') WHERE id = ?`, [points, pred.id])
  }

  await rebuildLeaderboard()
}

// Full leaderboard rebuild
export async function rebuildLeaderboard(): Promise<void> {
  const db = getDb()

  await execute(db, `DELETE FROM leaderboard`)

  await execute(db, `
    INSERT INTO leaderboard (user_id, username, total_points, exact_results, correct_diff, correct_winner, total_tips)
    SELECT
      u.id AS user_id,
      u.username,
      COALESCE(SUM(p.points), 0) AS total_points,
      COUNT(CASE WHEN p.points = (SELECT value FROM scoring_config WHERE key = 'exact_result') THEN 1 END) AS exact_results,
      COUNT(CASE WHEN p.points = (SELECT value FROM scoring_config WHERE key = 'correct_diff_and_winner') THEN 1 END) AS correct_diff,
      COUNT(CASE WHEN p.points = (SELECT value FROM scoring_config WHERE key = 'correct_winner') THEN 1 END) AS correct_winner,
      COUNT(p.id) AS total_tips
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL
    WHERE u.role = 'user'
    GROUP BY u.id, u.username
  `)

  // Assign ranks
  const entries = await queryAll<{ user_id: string; total_points: number }>(
    db,
    'SELECT user_id, total_points FROM leaderboard ORDER BY total_points DESC',
  )

  let rank = 1
  let lastPoints = -1
  let skip = 0

  for (const entry of entries) {
    if (entry.total_points !== lastPoints) {
      rank += skip
      skip = 1
      lastPoints = entry.total_points
    } else {
      skip++
    }
    await execute(db, `UPDATE leaderboard SET rank = ? WHERE user_id = ?`, [rank, entry.user_id])
  }
}
