import { formatDateTime, flagEmojiToCountryCode } from '@/lib/utils'
import { PredictionForm } from './PredictionForm'
import type { Match, Prediction } from '@/types'

interface Props {
  match: Match
  prediction?: Prediction | null
  showPredictionForm?: boolean
}

const statusConfig: Record<string, { label: string; chipClass: string }> = {
  scheduled: { label: 'Geplant',  chipClass: 'wm-chip' },
  live:       { label: 'Live',    chipClass: 'wm-chip wm-chip-live' },
  finished:   { label: 'Beendet', chipClass: 'wm-chip wm-chip-done' },
  locked:     { label: 'Gesperrt',chipClass: 'wm-chip' },
  cancelled:  { label: 'Abgesagt',chipClass: 'wm-chip' },
}

function FlagImg({ emoji, size }: { emoji?: string | null; size: number }) {
  const code = emoji ? flagEmojiToCountryCode(emoji) : null
  if (code) {
    return <img src={`https://flagcdn.com/w40/${code}.png`} alt={code.toUpperCase()} style={{ width: size, height: size * 0.67, objectFit: 'cover', borderRadius: 3 }} />
  }
  return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{emoji ?? '🏳️'}</span>
}

export function MatchCard({ match, prediction, showPredictionForm = true }: Props) {
  const st = statusConfig[match.status] ?? statusConfig['scheduled']!
  const isLive = match.status === 'live'
  const isDone = match.status === 'finished' && match.home_score !== null
  const hasScore = match.home_score !== null && match.away_score !== null

  return (
    <div className="wm-card" style={{ display: 'grid', gap: 0 }}>
      {/* meta */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        padding: '10px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)', borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="wm-chip" style={{ padding: '3px 9px', fontSize: 11, background: 'var(--surface)' }}>
            Gr. {match.group_name ?? '?'}
          </span>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
            {formatDateTime(match.match_time)}
          </span>
        </div>
        <span className={st.chipClass}>
          {isLive && <span className="wm-dot wm-dot-live" />}
          {st.label}
        </span>
      </div>

      {/* teams */}
      <div style={{ padding: '20px 18px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
        {/* home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <FlagImg emoji={match.home_team_flag} size={36} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, textAlign: 'right', color: 'var(--ink)', lineHeight: 1.2 }}>
            {match.home_team}
          </span>
        </div>

        {/* score */}
        <div style={{ display: 'grid', placeItems: 'center', minWidth: 100 }}>
          {hasScore ? (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: isLive ? '#ef4444' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {match.home_score} : {match.away_score}
            </span>
          ) : (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--muted-2)' }}>–&nbsp;:&nbsp;–</span>
          )}
        </div>

        {/* away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <FlagImg emoji={match.away_team_flag} size={36} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, textAlign: 'left', color: 'var(--ink)', lineHeight: 1.2 }}>
            {match.away_team}
          </span>
        </div>
      </div>

      {/* venue + prediction */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '12px 18px', borderTop: '1px solid var(--border)',
        background: 'var(--surface-2)', borderRadius: '0 0 var(--r-lg) var(--r-lg)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
          {match.venue ?? ''}
        </span>
        {showPredictionForm && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
              Mein Tipp
            </span>
            <PredictionForm match={match} existing={prediction} />
          </div>
        )}
      </div>
    </div>
  )
}
