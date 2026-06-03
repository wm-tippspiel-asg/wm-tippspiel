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

  const liveMatches = matchData.filter((m: any) => m.status === 'live')
  const recentMatches = matchData.filter((m: any) => m.status === 'finished').slice(-5).reverse()
  const upcomingMatches = matchData.filter((m: any) => m.status === 'scheduled').slice(0, 6)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <header className="wm-nav">
        <div className="shell wm-nav-inner">
          <Link href="/" className="wm-brand">
            <img src="/logo.png" alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
            <div>
              WM Tippspiel ASG
              <small>FIFA WM 2026</small>
            </div>
          </Link>
          <div className="wm-nav-right">
            <Link href="/login" className="wm-btn wm-btn-ghost" style={{ fontSize: 14, padding: '8px 16px' }}>
              Anmelden
            </Link>
            <Link href="/register" className="wm-btn wm-btn-primary" style={{ fontSize: 14, padding: '8px 16px' }}>
              Registrieren
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <div className="shell" style={{ padding: '28px 24px', display: 'grid', gap: 28 }}>

          {/* Hero */}
          <div className="wm-card wm-hero wm-fade-in">
            <div className="wm-hero-pattern" />
            <div className="wm-hero-body">
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700,
                letterSpacing: '.1em', textTransform: 'uppercase', opacity: .8 }}>
                FIFA Weltmeisterschaft 2026 · USA / Kanada / Mexiko
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(24px, 5vw, 38px)',
                fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                WM Tippspiel ASG
              </h1>
              <p style={{ margin: '0 0 22px', fontSize: 15, opacity: .85, maxWidth: 400 }}>
                Tippe Spielergebnisse, sammle Punkte und kämpfe um den ersten Platz in der Rangliste.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', background: 'var(--surface)', color: 'var(--accent-strong)',
                  borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  Jetzt mitmachen →
                </Link>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', background: 'rgba(255,255,255,0.12)', color: 'inherit',
                  borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.18)' }}>
                  Einloggen
                </Link>
              </div>
            </div>
          </div>

          {/* Live */}
          {liveMatches.length > 0 && (
            <section style={{ display: 'grid', gap: 12 }}>
              <SectionHeader title="Live" eyebrow="Jetzt" />
              <div style={{ display: 'grid', gap: 8 }}>
                {liveMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
              </div>
            </section>
          )}

          {/* Recent + Upcoming side by side on wide screens */}
          {(recentMatches.length > 0 || upcomingMatches.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {recentMatches.length > 0 && (
                <section style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
                  <SectionHeader title="Ergebnisse" eyebrow="Zuletzt" />
                  <div style={{ display: 'grid', gap: 6 }}>
                    {recentMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
                  </div>
                </section>
              )}
              {upcomingMatches.length > 0 && (
                <section style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
                  <SectionHeader title="Spielplan" eyebrow="Nächste Spiele" />
                  <div style={{ display: 'grid', gap: 6 }}>
                    {upcomingMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* No data yet */}
          {matchData.length === 0 && (
            <div className="wm-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}></div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>
                Spielplan kommt bald
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                Die WM 2026 startet am 11. Juni - Gruppen und Spielplan erscheinen dann hier.
              </div>
            </div>
          )}

          {/* Groups */}
          {standingsData.length > 0 && (
            <section style={{ display: 'grid', gap: 14 }}>
              <SectionHeader title="Gruppenphase" eyebrow="WM 2026" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {standingsData.map((g: any) => <GroupCard key={g.group} group={g} />)}
              </div>
            </section>
          )}

          {/* Bottom CTA */}
          <div className="wm-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>
              Nur für ASG-Schüler
            </p>
            <h2 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 800,
              letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Jetzt anmelden und tippen
            </h2>
            <Link href="/register" className="wm-btn wm-btn-primary" style={{ fontSize: 15, padding: '11px 28px' }}>
              Konto erstellen
            </Link>
          </div>

        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px',
        textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
        © {new Date().getFullYear()} WM-Tippspiel ASG — Nur für den Schulgebrauch
      </footer>
    </div>
  )
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div>
      <p className="wm-eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</p>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--ink)',
        fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{title}</h2>
    </div>
  )
}

function MatchRow({ match }: { match: any }) {
  const date = new Date(match.match_time)
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="wm-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Status / date */}
      <div style={{ minWidth: 42, textAlign: 'center' }}>
        {isLive ? (
          <span className="wm-chip wm-chip-live" style={{ fontSize: 10 }}>
            <span className="wm-dot wm-dot-live" />
            Live
          </span>
        ) : (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{dateStr}</div>
            {!isFinished && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{timeStr}</div>}
          </div>
        )}
      </div>

      {/* Teams + score */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textAlign: 'right',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {match.home_team}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums', padding: '3px 10px',
          background: 'var(--surface-2)', borderRadius: 8, textAlign: 'center', minWidth: 52 }}>
          {isFinished || isLive
            ? `${match.home_score ?? 0} : ${match.away_score ?? 0}`
            : '–  :  –'}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {match.away_team}
        </span>
      </div>

      {/* Group */}
      {match.group && (
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
          {match.group.replace('GROUP_', 'Gr. ')}
        </div>
      )}
    </div>
  )
}

function GroupCard({ group }: { group: any }) {
  return (
    <div className="wm-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)',
        fontWeight: 800, fontSize: 12, color: 'var(--accent-strong)',
        fontFamily: 'var(--font-display)', letterSpacing: '.05em',
        textTransform: 'uppercase' }}>
        {group.group.replace('GROUP_', 'Gruppe ')}
      </div>
      {group.teams.map((team: any, i: number) => (
        <div key={team.name} style={{
          display: 'grid',
          gridTemplateColumns: '18px 18px 1fr auto auto',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderTop: i > 0 ? '1px solid var(--border)' : 'none',
          background: i < 2 ? 'color-mix(in oklab, var(--good) 5%, transparent)' : 'transparent',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>
            {team.position}
          </span>
          {team.crest
            ? <img src={team.crest} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
            : <span />}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team.name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
            {team.goalsFor}:{team.goalsAgainst}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums', minWidth: 20, textAlign: 'right' }}>
            {team.points}
          </span>
        </div>
      ))}
    </div>
  )
}
