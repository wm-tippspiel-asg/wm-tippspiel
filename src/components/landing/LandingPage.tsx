import { fetchFootballMatches, fetchFootballStandings } from '@/lib/football-api'
import Link from 'next/link'

export default async function LandingPage() {
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
        <div className="shell landing-nav-inner">
          <Link href="/home" className="wm-brand" style={{ minWidth: 0, overflow: 'hidden' }}>
            <img src="/logo.png" alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <span className="landing-brand-full">WM Tippspiel ASG</span>
              <span className="landing-brand-short">WM ASG</span>
              <small className="landing-brand-sub">FIFA WM 2026</small>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <Link href="/login" className="wm-btn wm-btn-primary" style={{ fontSize: 14, padding: '8px 16px' }}>
              Anmelden
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <div className="shell landing-shell">

          {/* Hero */}
          <div className="wm-card wm-hero wm-fade-in">
            <div className="wm-hero-pattern" />
            <div className="wm-hero-body">
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700,
                letterSpacing: '.1em', textTransform: 'uppercase', opacity: .75 }}>
                FIFA Weltmeisterschaft 2026 · USA / Kanada / Mexiko
              </p>
              <h1 style={{ margin: '0 0 10px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}
                className="landing-h1">
                WM Tippspiel ASG
              </h1>
              <p style={{ margin: '0 0 22px', fontSize: 15, opacity: .85, maxWidth: 380, lineHeight: 1.55 }}>
                Ein Tippspiel des Informatikkurses der 11.Klasse des Albert-Schweitzer-Gymnasiums Hamburg.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', background: 'var(--surface)', color: 'var(--accent-strong)',
                  borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}>
                  Jetzt anmelden →
                </Link>
                <Link href="/login" style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '10px 20px', background: 'rgba(255,255,255,0.12)', color: 'inherit',
                  borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}>
                  Einloggen
                </Link>
              </div>
            </div>
          </div>

          {/* Live */}
          {liveMatches.length > 0 && (
            <section style={{ display: 'grid', gap: 10 }}>
              <SectionHeader title="Live" eyebrow="Jetzt" />
              <div style={{ display: 'grid', gap: 6 }}>
                {liveMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
              </div>
            </section>
          )}

          {/* Recent + Upcoming */}
          {(recentMatches.length > 0 || upcomingMatches.length > 0) && (
            <div className="landing-two-col">
              {recentMatches.length > 0 && (
                <section style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                  <SectionHeader title="Ergebnisse" eyebrow="Zuletzt" />
                  <div style={{ display: 'grid', gap: 5 }}>
                    {recentMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
                  </div>
                </section>
              )}
              {upcomingMatches.length > 0 && (
                <section style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                  <SectionHeader title="Spielplan" eyebrow="Nächste Spiele" />
                  <div style={{ display: 'grid', gap: 5 }}>
                    {upcomingMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* No data yet */}
          {matchData.length === 0 && (
            <div className="wm-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}></div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
                Spielplan kommt bald
              </p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
                Die WM 2026 startet am 11. Juni - Gruppen und Spielplan erscheinen dann hier.
              </p>
            </div>
          )}

          {/* Groups */}
          {standingsData.length > 0 && (
            <section style={{ display: 'grid', gap: 14 }}>
              <SectionHeader title="Gruppenphase" eyebrow="WM 2026" />
              <div className="landing-groups-grid">
                {standingsData.map((g: any) => <GroupCard key={g.group} group={g} />)}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="wm-card" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>
              Nur für ASG-Schüler
            </p>
            <h2 style={{ margin: '0 0 18px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}
              className="landing-cta-h2">
              Jetzt anmelden und tippen
            </h2>
            <Link href="/login" className="wm-btn wm-btn-primary" style={{ fontSize: 15, padding: '11px 28px' }}>
              Anmelden
            </Link>
          </div>

        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '18px 24px',
        textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
        © {new Date().getFullYear()} WM-Tippspiel ASG - Nur für den Schulgebrauch
      </footer>
    </div>
  )
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div>
      <p className="wm-eyebrow" style={{ margin: '0 0 3px' }}>{eyebrow}</p>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--ink)',
        fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{title}</h2>
    </div>
  )
}

function MatchRow({ match }: { match: any }) {
  const date = new Date(match.match_time)
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  return (
    <div className="wm-card landing-match-row">
      {/* Date / status */}
      <div className="landing-match-meta">
        {isLive ? (
          <span className="wm-chip wm-chip-live" style={{ fontSize: 10, padding: '3px 7px' }}>
            <span className="wm-dot wm-dot-live" />
            Live
          </span>
        ) : (
          <>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', display: 'block' }}>
              {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </span>
            {!isFinished && (
              <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>
                {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </>
        )}
      </div>

      {/* Home team */}
      <span className="landing-match-team" style={{ textAlign: 'right' }}>
        {match.home_team}
      </span>

      {/* Score */}
      <span className="landing-match-score">
        {isFinished || isLive
          ? `${match.home_score ?? 0} : ${match.away_score ?? 0}`
          : '– : –'}
      </span>

      {/* Away team */}
      <span className="landing-match-team">
        {match.away_team}
      </span>

      {/* Group */}
      {match.group && (
        <span className="landing-match-group">
          {match.group.replace('GROUP_', 'Gr. ')}
        </span>
      )}
    </div>
  )
}

function GroupCard({ group }: { group: any }) {
  return (
    <div className="wm-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)',
        fontWeight: 800, fontSize: 11, color: 'var(--accent-strong)',
        fontFamily: 'var(--font-display)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
        {group.group.replace('GROUP_', 'Gruppe ')}
      </div>
      {group.teams.map((team: any, i: number) => (
        <div key={team.name} className="landing-group-row"
          style={{ background: i < 2 ? 'color-mix(in oklab, var(--good) 5%, transparent)' : undefined,
            borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textAlign: 'center', width: 16 }}>
            {team.position}
          </span>
          {team.crest
            ? <img src={team.crest} alt="" style={{ width: 15, height: 15, objectFit: 'contain', flexShrink: 0 }} />
            : <span style={{ width: 15 }} />}
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {team.name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {team.goalsFor}:{team.goalsAgainst}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums', width: 22, textAlign: 'right', flexShrink: 0 }}>
            {team.points}
          </span>
        </div>
      ))}
    </div>
  )
}
