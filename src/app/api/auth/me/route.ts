import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role')
  const username = request.headers.get('x-username')

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    data: { id: userId, username, role },
  })
}
