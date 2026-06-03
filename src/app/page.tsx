import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'

export const runtime = 'edge'

export default async function RootPage() {
  const user = await getCurrentUser()

  if (user) {
    if (user.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', lineHeight: 1.1 }}>WM 2026</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Tippspiel</div>
          </div>
        </div>
        <Link href="/login" className="wm-btn wm-btn-ghost" style={{ fontSize: 14, padding: '8px 16px' }}>
          Anmelden
        </Link>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }} className="wm-fade-in">

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
            letterSpacing: '.06em', textTransform: 'uppercase',
            background: 'var(--accent-soft)', color: 'var(--accent-strong)',
            border: '1px solid var(--accent-line)' }}>
            ⚽ WM 2026 · USA / Kanada / Mexiko
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 8vw, 58px)',
            fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)',
            lineHeight: 1.05, margin: '0 0 16px' }}>
            Tippe dich an{' '}
            <span style={{ color: 'var(--accent)' }}>die Spitze</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--ink-2)',
            lineHeight: 1.6, margin: '0 0 40px', fontWeight: 500 }}>
            Sage Spielergebnisse voraus, sammle Punkte und kämpfe um den ersten Platz in der Rangliste.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="wm-btn wm-btn-primary"
              style={{ fontSize: 16, padding: '13px 28px' }}>
              Jetzt anmelden
            </Link>
            <Link href="/register" className="wm-btn wm-btn-ghost"
              style={{ fontSize: 16, padding: '13px 28px' }}>
              Konto erstellen
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginTop: 56,
            background: 'var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
            border: '1px solid var(--border)' }}>
            {[
              { v: '48', label: 'Spiele' },
              { v: '3', label: 'Länder' },
              { v: '32', label: 'Teams' },
            ].map(({ v, label }, i) => (
              <div key={i} style={{ flex: 1, padding: '20px 12px', background: 'var(--surface)',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid var(--border)' : undefined }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
                  color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', fontSize: 13, color: 'var(--muted)' }}>
        © {new Date().getFullYear()} WM-Tippspiel 2026 — Nur für den Schulgebrauch
      </footer>
    </div>
  )
}
