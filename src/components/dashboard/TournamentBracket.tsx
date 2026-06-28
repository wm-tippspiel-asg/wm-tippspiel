'use client'

import type { Match, MatchRound } from '@/types'
import { formatTime, formatDate, flagEmojiToCountryCode } from '@/lib/utils'

const KO_ROUNDS: { round: MatchRound; label: string; short: string }[] = [
  { round: 'round_of_16', label: 'Sechzehntelfinale', short: 'R32' },
  { round: 'round_of_8',  label: 'Achtelfinale',      short: 'R16' },
  { round: 'quarter_final', label: 'Viertelfinale',   short: 'VF'  },
  { round: 'semi_final',  label: 'Halbfinale',        short: 'HF'  },
  { round: 'final',       label: 'Finale',            short: 'F'   },
]

function FlagImg({ emoji, size = 20 }: { emoji?: string | null; size?: number }) {
  const code = emoji ? flagEmojiToCountryCode(emoji) : null
  if (code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        alt={code.toUpperCase()}
        style={{ width: size, height: Math.round(size * 0.67), objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
      />
    )
  }
  if (emoji) return <span style={{ fontSize: size * 0.85, lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
  return <span style={{ width: size, height: Math.round(size * 0.67), flexShrink: 0, display: 'inline-block' }} />
}

function BracketCard({ match }: { match: Match }) {
  const hasScore = match.home_score !== null && match.away_score !== null
  const isLive  = match.status === 'live'
  const isDone  = match.status === 'finished' && hasScore
  const homeWin = hasScore && match.home_score! > match.away_score!
  const awayWin = hasScore && match.away_score! > match.home_score!
  const isTbd   = match.home_team === 'TBD'

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1.5px solid ${isLive ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      width: '100%',
      opacity: isTbd ? 0.6 : 1,
    }}>
      {/* Home team */}
      <TeamRow
        name={match.home_team}
        flag={match.home_team_flag}
        score={match.home_score}
        hasScore={hasScore}
        isWinner={homeWin}
        isLive={isLive}
        borderBottom
      />
      {/* Away team */}
      <TeamRow
        name={match.away_team}
        flag={match.away_team_flag}
        score={match.away_score}
        hasScore={hasScore}
        isWinner={awayWin}
        isLive={isLive}
        borderBottom={false}
      />
      {/* Date row */}
      <div style={{
        padding: '4px 10px',
        fontSize: 10.5,
        color: 'var(--muted)',
        background: 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
          {match.venue?.split(',')[0]}
        </span>
        <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {formatDate(match.match_time)} {formatTime(match.match_time)}
          {isLive && <span style={{ marginLeft: 5, color: '#ef4444', fontWeight: 700 }}>● LIVE</span>}
        </span>
      </div>
    </div>
  )
}

function TeamRow({
  name,
  flag,
  score,
  hasScore,
  isWinner,
  isLive,
  borderBottom,
}: {
  name: string
  flag: string | null
  score: number | null
  hasScore: boolean
  isWinner: boolean
  isLive: boolean
  borderBottom: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '7px 10px',
      borderBottom: borderBottom ? '1px solid var(--border)' : undefined,
      background: isWinner ? 'var(--surface-2)' : 'transparent',
    }}>
      <FlagImg emoji={flag} size={18} />
      <span style={{
        flex: 1,
        fontSize: 12.5,
        fontWeight: isWinner ? 700 : 500,
        color: isWinner ? 'var(--ink)' : 'var(--ink-2)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
      {hasScore ? (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 15,
          minWidth: 16,
          textAlign: 'right',
          color: isLive ? '#ef4444' : (isWinner ? 'var(--ink)' : 'var(--muted)'),
        }}>
          {score}
        </span>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--muted-2)', minWidth: 16, textAlign: 'right' }}>–</span>
      )}
    </div>
  )
}

/* A bracket column with pair-grouping lines */
function BracketColumn({
  label,
  count,
  matches,
  pairSize,
  isLast,
}: {
  label: string
  count: string
  matches: Match[]
  pairSize: number   // how many matches form one bracket pair feeding into next round
  isLast: boolean
}) {
  const pairs: Match[][] = []
  for (let i = 0; i < matches.length; i += pairSize) {
    pairs.push(matches.slice(i, i + pairSize))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 200, flex: '0 0 200px' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '10px 6px 12px',
        borderBottom: '2px solid var(--border)',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', letterSpacing: '.01em' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{count}</div>
      </div>

      {/* Pairs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        {pairs.map((pair, pi) => (
          <div key={pi} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
            {pair.map((match, mi) => (
              <div key={match.id} style={{ position: 'relative' }}>
                <BracketCard match={match} />
                {/* Connecting line to right */}
                {!isLast && (
                  <div style={{
                    position: 'absolute',
                    right: -17,
                    top: '50%',
                    width: 17,
                    height: mi === 0
                      ? 'calc(50% + 19px)' // top of pair: line goes down to midpoint
                      : '50%',             // bottom of pair: line goes up to midpoint
                    borderRight: '2px solid var(--border)',
                    borderTop: mi === 1 ? '2px solid var(--border)' : undefined,
                    borderBottom: mi === 0 ? '2px solid var(--border)' : undefined,
                    transform: mi === 1 ? 'translateY(-100%)' : undefined,
                  }} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Final/3rd-place combined column */
function FinalColumn({ finalMatch, thirdMatch }: { finalMatch?: Match; thirdMatch?: Match }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 200, flex: '0 0 200px' }}>
      <div style={{
        textAlign: 'center',
        padding: '10px 6px 12px',
        borderBottom: '2px solid var(--border)',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Finale</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>26. Juli · MetLife</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* Third place */}
        {thirdMatch && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Platz 3
            </div>
            <BracketCard match={thirdMatch} />
          </div>
        )}
        {/* Final */}
        {finalMatch && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              ★ Finale
            </div>
            <BracketCard match={finalMatch} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Mobile: rounds as accordion sections                        */
/* ─────────────────────────────────────────────────────────── */
function MobileBracket({ byRound }: { byRound: Record<string, Match[]> }) {
  const sections = [
    { round: 'round_of_16', label: 'Sechzehntelfinale', icon: '⚽' },
    { round: 'round_of_8',  label: 'Achtelfinale',      icon: '⚽' },
    { round: 'quarter_final', label: 'Viertelfinale',   icon: '🥅' },
    { round: 'semi_final',  label: 'Halbfinale',        icon: '🔥' },
    { round: 'third_place', label: 'Spiel um Platz 3',  icon: '🥉' },
    { round: 'final',       label: 'Finale',            icon: '🏆' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {sections.map(({ round, label, icon }) => {
        const matches = byRound[round] ?? []
        if (matches.length === 0) return null
        return (
          <div key={round}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: '2px solid var(--border)',
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
                {label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
                {matches.length} {matches.length === 1 ? 'Spiel' : 'Spiele'}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {matches.map(m => <BracketCard key={m.id} match={m} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Main export                                                 */
/* ─────────────────────────────────────────────────────────── */
export function TournamentBracket({ matches }: { matches: Match[] }) {
  const byRound: Record<string, Match[]> = {}
  for (const m of matches) {
    if (!byRound[m.round]) byRound[m.round] = []
    ;(byRound[m.round] as Match[]).push(m)
  }

  const r32 = byRound['round_of_16'] ?? []
  const r16 = byRound['round_of_8']  ?? []
  const qf  = byRound['quarter_final'] ?? []
  const sf  = byRound['semi_final']  ?? []
  const tp  = byRound['third_place'] ?? []
  const fin = byRound['final']       ?? []

  return (
    <>
      {/* Desktop bracket — horizontal scrollable tree */}
      <div className="bracket-wrap">
        <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
          <div style={{
            display: 'flex',
            gap: 34,
            minWidth: 1260,
            alignItems: 'flex-start',
            padding: '0 4px',
          }}>
            {r32.length > 0 && (
              <BracketColumn
                label="Sechzehntelfinale"
                count="16 Spiele"
                matches={r32}
                pairSize={2}
                isLast={false}
              />
            )}
            {r16.length > 0 && (
              <BracketColumn
                label="Achtelfinale"
                count="8 Spiele"
                matches={r16}
                pairSize={2}
                isLast={false}
              />
            )}
            {qf.length > 0 && (
              <BracketColumn
                label="Viertelfinale"
                count="4 Spiele"
                matches={qf}
                pairSize={2}
                isLast={false}
              />
            )}
            {sf.length > 0 && (
              <BracketColumn
                label="Halbfinale"
                count="2 Spiele"
                matches={sf}
                pairSize={2}
                isLast={false}
              />
            )}
            <FinalColumn
              finalMatch={fin[0]}
              thirdMatch={tp[0]}
            />
          </div>
        </div>
      </div>

      {/* Mobile list — shown when screen is narrow */}
      <div className="bracket-mobile">
        <MobileBracket byRound={byRound} />
      </div>
    </>
  )
}
