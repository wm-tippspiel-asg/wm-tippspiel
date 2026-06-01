import type { LeaderboardEntry } from '@/types'

interface Props {
  entries: LeaderboardEntry[]
  currentUserId: string
}

const medals = ['🥇', '🥈', '🥉']

export function LeaderboardTable({ entries, currentUserId }: Props) {
  if (entries.length === 0) {
    return (
      <p style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 15 }}>
        Noch keine Punkte — tippe auf Spiele und schau nach Spielende wieder rein.
      </p>
    )
  }

  return (
    <div style={{ overflow: 'hidden' }}>
      {entries.map((e, i) => {
        const isMe = e.user_id === currentUserId
        const rank = e.rank ?? i + 1

        return (
          <div key={e.user_id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '13px 20px',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            background: isMe ? 'var(--accent-soft)' : 'transparent',
          }}>
            {/* rank */}
            <div style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {rank <= 3
                ? <span style={{ fontSize: 20 }}>{medals[rank - 1]}</span>
                : <span style={{ fontSize: 14, color: 'var(--muted)' }}>{rank}</span>
              }
            </div>

            {/* color dot */}
            <span style={{
              width: 9, height: 9, borderRadius: 99, flexShrink: 0,
              background: rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : 'var(--surface-3)',
            }} />

            {/* name */}
            <span style={{ flex: 1, fontWeight: 700, color: isMe ? 'var(--accent-strong)' : 'var(--ink)', fontSize: 15 }}>
              {e.username}
              {isMe && (
                <span className="wm-chip wm-chip-open" style={{ marginLeft: 8, fontSize: 10, padding: '2px 7px', verticalAlign: 'middle' }}>Du</span>
              )}
            </span>

            {/* stats */}
            <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, display: 'none', alignItems: 'center', gap: 4 }}
              className="md-show">
              {e.exact_results}× Exakt
            </span>

            {/* points */}
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, width: 48, textAlign: 'right',
              color: rank === 1 ? 'var(--good)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {e.total_points}
            </span>
          </div>
        )
      })}
    </div>
  )
}
