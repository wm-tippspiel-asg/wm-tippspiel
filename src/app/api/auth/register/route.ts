import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: 'Registrierung ist deaktiviert.' },
    { status: 410 },
  )
}
