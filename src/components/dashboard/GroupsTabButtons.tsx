'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export function GroupsTabButtons() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') ?? 'gruppen'

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: 9,
    fontSize: 13.5,
    fontWeight: 700,
    textDecoration: 'none',
    transition: 'background .15s, color .15s',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
  })

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Link href="/groups" style={tabStyle(view === 'gruppen')}>
        Gruppen
      </Link>
      <Link href="/groups?view=ko" style={tabStyle(view === 'ko')}>
        KO-Phase
      </Link>
    </div>
  )
}
