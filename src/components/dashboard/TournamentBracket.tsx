'use client'

import type { Match } from '@/types'
import { formatTime, formatDate, flagEmojiToCountryCode } from '@/lib/utils'

// ── Layout constants ──────────────────────────────────────────────────────────
// CARD_H must match the actual rendered card height.
// Card = 2 × TeamRow (≈30px each) + separator (1px) + date row (≈22px) = ≈83px
const CARD_H  = 84
const SLOT    = 96   // CARD_H + 12px gap between adjacent slots
const TOTAL_H = 16 * SLOT  // 1536px — anchored to 16 R32 matches

const COL_W   = 230  // wide enough for long names like "Kapverdische Inseln"
const COL_GAP = 32   // horizontal gap between columns (connectors live here)

// Vertical top of card for round k (0 = R32), match index j.
// Derived so that every card is centered between its two source cards from round k−1.
// Formula: SLOT × (2^k × (j + 0.5) − 0.5)
function slotTop(k: number, j: number): number {
  return SLOT * (Math.pow(2, k) * (j + 0.5) - 0.5)
}

// ── FlagImg ───────────────────────────────────────────────────────────────────
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

// ── TeamRow ───────────────────────────────────────────────────────────────────
function TeamRow({ name, flag, score, hasScore, isWinner, isLive, borderBottom }: {
  name: string
  flag: string | null
  score: number | null
  hasScore: boolean
  isWinner: boolean
  isLive: boolean
  borderBottom: boolean
}) {
  const isTbd = name === 'TBD'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '7px 10px',
      borderBottom: borderBottom ? '1px solid var(--border)' : undefined,
      background: isWinner ? 'var(--surface-2)' : 'transparent',
    }}>
      <FlagImg emoji={flag} size={18} />
      <span style={{
        flex: 1, fontSize: 12.5, fontWeight: isWinner ? 700 : 500,
        color: isTbd ? 'var(--muted-2)' : isWinner ? 'var(--ink)' : 'var(--ink-2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontStyle: isTbd ? 'italic' : undefined,
      }}>
        {isTbd ? 'noch offen' : name}
      </span>
      {hasScore ? (
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
          minWidth: 16, textAlign: 'right',
          color: isLive ? 'var(--live)' : (isWinner ? 'var(--ink)' : 'var(--muted)'),
        }}>{score}</span>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--muted-2)', minWidth: 16, textAlign: 'right' }}>–</span>
      )}
    </div>
  )
}

// ── BracketCard ───────────────────────────────────────────────────────────────
function BracketCard({ match }: { match: Match }) {
  const hasScore = match.home_score !== null && match.away_score !== null
  const isLive   = match.status === 'live'
  const homeWin  = hasScore && match.home_score! > match.away_score!
  const awayWin  = hasScore && match.away_score! > match.home_score!
  const isTbd    = match.home_team === 'TBD'

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1.5px solid ${isLive ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      width: '100%',
      opacity: isTbd ? 0.5 : 1,
      boxShadow: isTbd ? 'none' : 'var(--shadow-sm)',
    }}>
      <TeamRow name={match.home_team} flag={match.home_team_flag} score={match.home_score}
        hasScore={hasScore} isWinner={homeWin} isLive={isLive} borderBottom />
      <TeamRow name={match.away_team} flag={match.away_team_flag} score={match.away_score}
        hasScore={hasScore} isWinner={awayWin} isLive={isLive} borderBottom={false} />
      <div style={{
        padding: '4px 10px', fontSize: 10.5, color: 'var(--muted)',
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
          {match.venue?.split(',')[0] ?? ''}
        </span>
        <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {isTbd ? '–' : `${formatDate(match.match_time)} ${formatTime(match.match_time)}`}
          {isLive && <span style={{ marginLeft: 5, color: 'var(--live)', fontWeight: 700 }}>● LIVE</span>}
        </span>
      </div>
    </div>
  )
}

// ── MatchSlot: one absolutely-positioned card + its right-side connectors ─────
function MatchSlot({
  match, k, j, matchCount, isLast,
}: {
  match: Match
  k: number
  j: number
  matchCount: number
  isLast: boolean
}) {
  const top           = slotTop(k, j)
  const isTopOfPair   = j % 2 === 0
  const hasSibling    = isTopOfPair && j + 1 < matchCount
  // Height of vertical bar = distance between this card center and sibling center
  const vertH         = SLOT * Math.pow(2, k)
  // Y of parent card center relative to this card's top = midpoint of [CARD_H/2, CARD_H/2 + vertH]
  const parentRelY    = (CARD_H + vertH) / 2

  return (
    <div style={{ position: 'absolute', top, width: COL_W, left: 0 }}>
      <BracketCard match={match} />

      {!isLast && (
        <>
          {/* ── Horizontal stub right from card center ── */}
          <div style={{
            position: 'absolute',
            top: CARD_H / 2 - 1,
            left: COL_W,
            width: COL_GAP / 2,
            height: 2,
            background: 'var(--border)',
            pointerEvents: 'none',
          }} />

          {hasSibling && (
            <>
              {/* ── Vertical bar at midpoint-X, from this center to sibling center ── */}
              <div style={{
                position: 'absolute',
                top: CARD_H / 2,
                left: COL_W + COL_GAP / 2 - 1,
                width: 2,
                height: vertH,
                background: 'var(--border)',
                pointerEvents: 'none',
              }} />
              {/* ── Horizontal stub from midpoint-X to next column ── */}
              <div style={{
                position: 'absolute',
                top: parentRelY - 1,
                left: COL_W + COL_GAP / 2 - 1,
                width: COL_GAP / 2 + 1,
                height: 2,
                background: 'var(--border)',
                pointerEvents: 'none',
              }} />
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Round column ──────────────────────────────────────────────────────────────
function RoundColumn({
  label, matches, k, colIndex, isLast,
}: {
  label: string
  matches: Match[]
  k: number
  colIndex: number
  isLast: boolean
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: colIndex * (COL_W + COL_GAP),
      width: COL_W,
      height: TOTAL_H,
    }}>
      {matches.map((match, j) => (
        <MatchSlot
          key={match.id}
          match={match}
          k={k}
          j={j}
          matchCount={matches.length}
          isLast={isLast}
        />
      ))}
    </div>
  )
}

// ── Column header row ─────────────────────────────────────────────────────────
function ColumnHeaders({ cols }: { cols: { label: string; matches: Match[] }[] }) {
  return (
    <div style={{ display: 'flex', gap: COL_GAP, marginBottom: 8 }}>
      {cols.map((col, i) => (
        <div key={i} style={{
          flex: `0 0 ${COL_W}px`,
          textAlign: 'center',
          padding: '10px 4px 12px',
          borderBottom: '2px solid var(--border)',
        }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', letterSpacing: '.01em' }}>
            {col.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {col.matches.length} {col.matches.length === 1 ? 'Spiel' : 'Spiele'}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Desktop bracket ───────────────────────────────────────────────────────────
const ROUND_DEFS = [
  { key: 'round_of_16',   label: 'Sechzehntelfinale', k: 0 },
  { key: 'round_of_8',    label: 'Achtelfinale',       k: 1 },
  { key: 'quarter_final', label: 'Viertelfinale',      k: 2 },
  { key: 'semi_final',    label: 'Halbfinale',         k: 3 },
  { key: 'final',         label: 'Finale',             k: 4 },
]

function DesktopBracket({
  byRound,
}: {
  byRound: Record<string, Match[]>
}) {
  const cols = ROUND_DEFS
    .map(d => ({ ...d, matches: byRound[d.key] ?? [] }))
    .filter(c => c.matches.length > 0)

  const tp        = byRound['third_place'] ?? []
  const numCols   = cols.length
  const totalW    = numCols * COL_W + (numCols - 1) * COL_GAP

  // Third place: shown below the Final card with a small label
  const finalK    = 4
  const thirdTop  = slotTop(finalK, 0) + CARD_H + 48

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
      <div style={{ minWidth: totalW + 4, userSelect: 'none' }}>
        <ColumnHeaders cols={cols} />

        <div style={{ position: 'relative', height: TOTAL_H }}>
          {cols.map((col, ci) => (
            <RoundColumn
              key={col.key}
              label={col.label}
              matches={col.matches}
              k={col.k}
              colIndex={ci}
              isLast={ci === numCols - 1}
            />
          ))}

          {/* Third place match — in the Final column, below the Final card */}
          {tp[0] && numCols > 0 && (
            <div style={{
              position: 'absolute',
              top: thirdTop,
              left: (numCols - 1) * (COL_W + COL_GAP),
              width: COL_W,
            }}>
              <div style={{
                fontSize: 10.5, fontWeight: 700, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '.06em',
                marginBottom: 5,
              }}>
                Platz 3
              </div>
              <BracketCard match={tp[0]} />
            </div>
          )}

          {/* Final label overlay (★) above the final card */}
          {(byRound['final'] ?? []).length > 0 && numCols > 0 && (
            <div style={{
              position: 'absolute',
              top: slotTop(finalK, 0) - 20,
              left: (numCols - 1) * (COL_W + COL_GAP),
              width: COL_W,
              fontSize: 10.5, fontWeight: 700, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '.06em',
            }}>
              ★ WM-Finale · 26. Juli
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mobile: list by round ─────────────────────────────────────────────────────
const MOBILE_SECTIONS = [
  { key: 'round_of_16',   label: 'Sechzehntelfinale',  icon: '⚽' },
  { key: 'round_of_8',    label: 'Achtelfinale',        icon: '⚽' },
  { key: 'quarter_final', label: 'Viertelfinale',       icon: '🥅' },
  { key: 'semi_final',    label: 'Halbfinale',          icon: '🔥' },
  { key: 'third_place',   label: 'Spiel um Platz 3',   icon: '🥉' },
  { key: 'final',         label: 'Finale',              icon: '🏆' },
]

function MobileBracket({ byRound }: { byRound: Record<string, Match[]> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {MOBILE_SECTIONS.map(({ key, label, icon }) => {
        const ms = byRound[key] ?? []
        if (ms.length === 0) return null
        return (
          <div key={key}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 10, paddingBottom: 8,
              borderBottom: '2px solid var(--border)',
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
                {label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
                {ms.length} {ms.length === 1 ? 'Spiel' : 'Spiele'}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {ms.map(m => <BracketCard key={m.id} match={m} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function TournamentBracket({ matches }: { matches: Match[] }) {
  const byRound: Record<string, Match[]> = {}
  for (const m of matches) {
    if (!byRound[m.round]) byRound[m.round] = []
    ;(byRound[m.round] as Match[]).push(m)
  }

  return (
    <>
      <div className="bracket-wrap">
        <DesktopBracket byRound={byRound} />
      </div>
      <div className="bracket-mobile">
        <MobileBracket byRound={byRound} />
      </div>
    </>
  )
}
