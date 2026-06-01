import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, execute } from '@/lib/db'
import { codeCreateSchema } from '@/lib/validation'
import { generateRegistrationCode } from '@/lib/crypto'
import { audit } from '@/lib/audit'
import type { RegistrationCode } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  const db = getDb()
  const codes = await queryAll<RegistrationCode>(
    db,
    `SELECT rc.*, u.username AS created_by_username
     FROM registration_codes rc
     LEFT JOIN users u ON rc.created_by = u.id
     ORDER BY rc.created_at DESC`,
  )

  return NextResponse.json({ success: true, data: codes })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actorId = request.headers.get('x-user-id')
  const actorName = request.headers.get('x-username') ?? 'admin'
  const role = request.headers.get('x-user-role')
  if (role !== 'admin') return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const parsed = codeCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { description, max_uses, expires_at } = parsed.data
  const code = generateRegistrationCode(8)
  const db = getDb()

  await execute(
    db,
    `INSERT INTO registration_codes (code, description, max_uses, expires_at, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [code, description ?? null, max_uses ?? null, expires_at ?? null, actorId],
  )

  await audit({
    actorId,
    actorName,
    action: 'code.created',
    targetType: 'code',
    details: { code, max_uses, expires_at, description },
  })

  return NextResponse.json({ success: true, data: { code } }, { status: 201 })
}
