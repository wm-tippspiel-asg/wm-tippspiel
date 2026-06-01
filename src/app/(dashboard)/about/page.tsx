import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="wm-fade-in" style={{ maxWidth: 720, display: 'grid', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <img src="/logo.png" alt="Logo"
          style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'contain', boxShadow: 'var(--shadow)' }} />
        <div>
          <div className="wm-eyebrow">Schulprojekt 2026</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
            letterSpacing: '-0.02em', color: 'var(--ink)', margin: '4px 0 0' }}>
            WM-Tippspiel 2026
          </h1>
          <p style={{ marginTop: 6, fontSize: 15, color: 'var(--muted)', fontWeight: 500 }}>
            Ein Projekt des Informatikkurses, Klasse 11
          </p>
        </div>
      </div>

      {/* Über uns */}
      <div className="wm-card wm-card-pad">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 12 }}>Über das Projekt</h2>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
          Dieses Tippspiel ist eine Idee unseres Informatikkurses der Klasse 11, 2026.
          Da die FIFA Weltmeisterschaft in Kanada, Mexiko und den USA kurz bevorstand,
          haben wir uns überlegt ein Tippspiel für die ganze Schule zu bauen. Wir hoffen 
          euch gefällt es. Feedback gerne in der Schule persönlich oder per Mail.
        </p>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7, marginTop: 12 }}>
          Das Projekt wurde mit <strong style={{ color: 'var(--ink)' }}>Next.js</strong>,{' '}
          <strong style={{ color: 'var(--ink)' }}>TypeScript</strong> und{' '}
          <strong style={{ color: 'var(--ink)' }}>Cloudflare Pages</strong> gebaut
          und läuft komplett kostenlos in der Cloud. Bei der Umsetzung wurde{' '}
          <a href="https://claude.ai/code" target="_blank" rel="noopener"
            style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>
            Claude Code
          </a>{' '}von Anthropic als KI-Werkzeug eingesetzt.
        </p>
      </div>

      {/* Regeln */}
      <div className="wm-card wm-card-pad">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 16 }}>Spielregeln</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            'Für jedes WM-Spiel kannst du ein Ergebnis tippen.',
            'Tipps können bis zum offiziellen Anpfiff geändert werden.',
            'Nach Spielbeginn sind keine Änderungen mehr möglich.',
            'Punkte werden automatisch nach Spielende berechnet.',
            'Bei Punktegleichstand entscheidet die Anzahl exakter Treffer.',
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                color: 'var(--accent-strong)', background: 'var(--accent-soft)',
                borderRadius: 6, padding: '2px 7px', flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6 }}>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Punktesystem */}
      <div className="wm-card wm-card-pad">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 16 }}>Punktesystem</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { label: 'Exaktes Ergebnis', sub: 'z.B. 2:1 getippt → 2:1 erzielt', pts: 5, color: 'var(--good)' },
            { label: 'Richtige Differenz & Gewinner', sub: 'z.B. 3:1 getippt → 2:0 erzielt', pts: 3, color: 'var(--accent-strong)' },
            { label: 'Richtiger Gewinner oder Unentschieden', sub: 'Tendenz stimmt, Ergebnis nicht', pts: 2, color: 'var(--ink-2)' },
            { label: 'Falscher Tipp', sub: 'Kein Treffer', pts: 0, color: 'var(--muted)' },
          ].map((row) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 12,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{row.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{row.sub}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
                color: row.color, minWidth: 36, textAlign: 'right' }}>
                {row.pts > 0 ? `+${row.pts}` : '0'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Datenschutz */}
      <div className="wm-card wm-card-pad">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 12 }}>Datenschutz</h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
          Diese Anwendung ist ausschließlich für den internen Schulgebrauch bestimmt.
          Es werden nur Benutzername und ein sicherer Passwort-Hash gespeichert.
          Keine Daten werden an Dritte weitergegeben.
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>
          Quellcode auf{' '}
          <a href="https://github.com/wm-tippspiel-asg/wm-tippspiel" target="_blank" rel="noopener"
            style={{ color: 'var(--accent-strong)', fontWeight: 600, textDecoration: 'none' }}>
            GitHub
          </a>
          {' '}— Informatikkurs Klasse 11, 2026 - wm-tippspiel-asg@proton.me
        </p>
      </div>

    </div>
  )
}
