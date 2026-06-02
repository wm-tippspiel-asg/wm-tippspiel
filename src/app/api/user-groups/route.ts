import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll } from '@/lib/db'
import type { UserGroup } from '@/types'

export const runtime = 'edge'

// Returns all groups (for leaderboard filter dropdown)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })

  const db = getDb()
  const groups = await queryAll<UserGroup & { member_count: number }>(
    db,
    `SELECT ug.id, ug.name, ug.description, ug.created_by, ug.created_at,
            COUNT(ugm.user_id) AS member_count
     FROM user_groups ug
     LEFT JOIN user_group_members ugm ON ugm.group_id = ug.id
     GROUP BY ug.id
     ORDER BY ug.name ASC`,
  )

  return NextResponse.json({ success: true, data: groups })
}
