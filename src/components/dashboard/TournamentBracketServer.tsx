import { getDb, queryAll } from '@/lib/db'
import { TournamentBracket } from './TournamentBracket'
import type { Match } from '@/types'

export async function TournamentBracketServer() {
  const db = getDb()
  const matches = await queryAll<Match>(
    db,
    `SELECT * FROM matches WHERE round != 'group' ORDER BY match_time ASC`
  )

  return <TournamentBracket matches={matches} />
}
