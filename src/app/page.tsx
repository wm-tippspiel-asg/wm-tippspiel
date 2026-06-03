import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { fetchFootballMatches, fetchFootballStandings } from '@/lib/football-api'
import Link from 'next/link'

export const runtime = 'edge'

export default async function RootPage() {
  const user = await getCurrentUser()
  if (user) {
    if (user.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  const [matchResult, standingsResult] = await Promise.allSettled([
    fetchFootballMatches(),
    fetchFootballStandings(),
  ])

  const matchData: any[] = matchResult.status === 'fulfilled' && Array.isArray(matchResult.value) ? matchResult.value : []
  const standingsData: any[] = standingsResult.status === 'fulfilled' && Array.isArray(standingsResult.value) ? standingsResult.value : []

  const upcomingMatches = matchData
    .filter((m: any) => m.status === 'scheduled')
    .slice(0, 6)

  const liveOrFinished = matchData
    .filter((m: any) => m.status === 'live' || m.status === 'finished')
    .slice(-6)
    .reverse()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
              color: 'var(--ink)', lineHeight: 1.1 }}>WM Tippspiel ASG</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em',
              textTransform: 'uppercase', color: 'var(--muted)' }}>FIFA WM 2026</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/login" className="wm-btn wm-btn-ghost" style={{ fontSize: 14, padding: '8px 16px' }}>
            Anmelden
          </Link>
          <Link href="/register" className="wm-btn wm-btn-primary" style={{ fontSize: 14, padding: '8px 16px' }}>
            Registrieren
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '32px 16px', display: 'grid', gap: 32 }}>

        {/* Hero */}
        <div className="wm-card wm-hero">
          <div className="wm-hero-pattern" />
          <div className="wm-hero-body">
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em',
              textTransform: 'uppercase', opacity: .85, marginBottom: 12 }}>
              FIFA Weltmeisterschaft 2026
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800,
              letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 10px' }}>
              WM Tippspiel ASG
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: 15, opacity: .9, maxWidth: 460 }}>
              Tippe Spielergebnisse, sammle Punkte und kämpfe um den ersten Platz.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: 'var(--surface)', color: 'var(--accent-strong)',
                borderRadius: 11, fontWeight: 700, fontSize: 14.5, textDecoration: 'none' }}>
                Jetzt mitmachen →
              </Link>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: 'rgba(255,255,255,0.12)', color: 'inherit',
                borderRadius: 11, fontWeight: 600, fontSize: 14.5, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)' }}>
                Einloggen
              </Link>
            </div>
          </div>
        </div>

        {/* Live / Recent results */}
        {liveOrFinished.length > 0 && (
          <section style={{ display: 'grid', gap: 14 }}>
            <h2 className="wm-section-h2" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
              Aktuelle Ergebnisse
            </h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {liveOrFinished.map((m: any) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming matches */}
        {upcomingMatches.length > 0 && (
          <section style={{ display: 'grid', gap: 14 }}>
            <h2 className="wm-section-h2" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
              Nächste Spiele
            </h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {upcomingMatches.map((m: any) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}

        {/* No data yet */}
        {matchData.length === 0 && (
          <div className="wm-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>
              Spielplan wird geladen
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>
              Die WM 2026 startet am 11. Juni — Spielplan und Gruppen erscheinen hier sobald die Daten verfügbar sind.
            </div>
          </div>
        )}

        {/* Group standings */}
        {standingsData.length > 0 && (
          <section style={{ display: 'grid', gap: 14 }}>
            <h2 className="wm-section-h2" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
              Gruppenphase
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {standingsData.map((group: any) => (
                <GroupCard key={group.group} group={group} />
              ))}
            </div>
          </section>
        )}

        {/* CTA bottom */}
        <div className="wm-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 6,
            fontFamily: 'var(--font-display)' }}>
            Jetzt anmelden und tippen!
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Kostenlos — nur für Schüler der ASG.
          </div>
          <Link href="/register" className="wm-btn wm-btn-primary" style={{ fontSize: 15, padding: '11px 28px' }}>
            Konto erstellen
          </Link>
        </div>

      </main>

      <footer style={{ textAlign: 'center', padding: '20px', fontSize: 13, color: 'var(--muted)',
        borderTop: '1px solid var(--border)' }}>
        © {new Date().getFullYear()} WM-Tippspiel ASG — Nur für den Schulgebrauch
      </footer>
    </div>
  )
}

function MatchRow({ match }: { match: any }) {
  const date = new Date(match.match_time)
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  return (
    <div className="wm-card" style={{ padding: '14px 18px', display: 'flex',
      alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: isLive ? 'var(--good)' : 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 38 }}>
        {isLive ? '🔴 Live' : isFinished ? 'Ende' : date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', textAlign: 'right', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.home_team}</span>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', minWidth: 48,
          textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
          {isFinished || isLive
            ? `${match.home_score ?? 0} : ${match.away_score ?? 0}`
            : date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', textAlign: 'left', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.away_team}</span>
      </div>
      {match.group && (
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
          {match.group.replace('GROUP_', 'Gr. ')}
        </div>
      )}
    </div>
  )
}

function GroupCard({ group }: { group: any }) {
  return (
    <div className="wm-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)',
        fontWeight: 800, fontSize: 13, color: 'var(--accent-strong)', fontFamily: 'var(--font-display)',
        letterSpacing: '.04em' }}>
        {group.group.replace('GROUP_', 'Gruppe ')}
      </div>
      {group.teams.map((team: any, i: number) => (
        <div key={team.name} style={{ display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
          background: i < 2 ? 'rgba(34,197,94,0.04)' : undefined }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', minWidth: 14,
            textAlign: 'center' }}>{team.position}</span>
          {team.crest && (
            <img src={team.crest} alt={team.name} style={{ width: 18, height: 18, objectFit: 'contain' }} />
          )}
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums' }}>{team.points}</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 28, textAlign: 'right',
            fontVariantNumeric: 'tabular-nums' }}>{team.goalsFor}:{team.goalsAgainst}</span>
        </div>
      ))}
    </div>
  )
}
