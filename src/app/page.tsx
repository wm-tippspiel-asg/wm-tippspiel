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
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', position: 'relative', zIndex: 10 }}>
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

      {/* Hero Banner */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #0f3d2e 100%)',
        minHeight: 420,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Field lines decoration */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="400" cy="210" rx="200" ry="120" fill="none" stroke="white" strokeWidth="2" />
            <line x1="400" y1="0" x2="400" y2="420" stroke="white" strokeWidth="2" />
            <rect x="20" y="80" width="120" height="260" fill="none" stroke="white" strokeWidth="2" />
            <rect x="20" y="140" width="50" height="140" fill="none" stroke="white" strokeWidth="2" />
            <rect x="660" y="80" width="120" height="260" fill="none" stroke="white" strokeWidth="2" />
            <rect x="730" y="140" width="50" height="140" fill="none" stroke="white" strokeWidth="2" />
            <rect x="20" y="20" width="760" height="380" fill="none" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        {/* Glow */}
        <div style={{ position: 'absolute', top: '50%', left: '55%', transform: 'translate(-50%,-50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
          pointerEvents: 'none' }} />

        {/* Content: text left, player right */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', width: '100%', maxWidth: 1100, margin: '0 auto',
          padding: '48px 32px', gap: 24 }}>

          {/* Left: text */}
          <div style={{ flex: '1 1 0', minWidth: 0 }} className="wm-fade-in">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
              padding: '5px 13px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              letterSpacing: '.07em', textTransform: 'uppercase',
              background: 'rgba(34,197,94,0.15)', color: '#4ade80',
              border: '1px solid rgba(34,197,94,0.3)' }}>
              ⚽ WM 2026 · USA / Kanada / Mexiko
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900, letterSpacing: '-0.03em', color: '#fff',
              lineHeight: 1.05, margin: '0 0 16px' }}>
              Tippe dich an{' '}
              <span style={{ color: '#4ade80' }}>die Spitze</span>
            </h1>

            <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.65, margin: '0 0 32px', fontWeight: 400, maxWidth: 420 }}>
              Sage Spielergebnisse voraus, sammle Punkte und kämpfe um den ersten Platz in der Rangliste.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/login" className="wm-btn wm-btn-primary"
                style={{ fontSize: 15, padding: '12px 26px' }}>
                Jetzt anmelden
              </Link>
              <Link href="/register" className="wm-btn"
                style={{ fontSize: 15, padding: '12px 26px',
                  background: 'rgba(255,255,255,0.1)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)' }}>
                Konto erstellen
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 28, marginTop: 36 }}>
              {[
                { v: '48', label: 'Spiele' },
                { v: '3', label: 'Länder' },
                { v: '32', label: 'Teams' },
              ].map(({ v, label }, i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800,
                    color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: player silhouette */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            width: 'clamp(180px, 28vw, 320px)', opacity: 0.95 }}>
            <svg viewBox="0 0 260 400" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>
              {/* Glow behind player */}
              <ellipse cx="130" cy="390" rx="80" ry="12" fill="rgba(74,222,128,0.25)" />

              {/* Ball */}
              <circle cx="58" cy="310" r="26" fill="#1a1a2e" stroke="#4ade80" strokeWidth="2.5" />
              <path d="M58 284 L70 300 L58 316 L46 300 Z" fill="#4ade80" opacity="0.7" />
              <path d="M84 310 L68 298 L68 322 Z" fill="#4ade80" opacity="0.5" />
              <path d="M32 310 L48 298 L48 322 Z" fill="#4ade80" opacity="0.5" />

              {/* Right leg (kicking back) */}
              <path d="M145 255 Q160 275 170 300 Q175 315 165 325" stroke="white" strokeWidth="18" strokeLinecap="round" fill="none" />
              {/* Right boot */}
              <path d="M163 320 Q170 330 178 328 Q186 326 182 318 Q175 308 163 312 Z" fill="white" />

              {/* Left leg (planted, forward) */}
              <path d="M115 255 Q108 290 95 320 Q90 335 95 345" stroke="white" strokeWidth="18" strokeLinecap="round" fill="none" />
              {/* Left boot */}
              <path d="M91 340 Q82 352 90 358 Q98 362 105 352 Q108 342 97 336 Z" fill="white" />

              {/* Body/torso — jersey */}
              <path d="M108 160 Q100 195 105 235 Q110 258 130 262 Q150 265 155 240 Q162 215 155 175 Z"
                fill="#1e40af" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              {/* Jersey number/stripe */}
              <path d="M113 190 L147 190" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <text x="122" y="215" fill="rgba(255,255,255,0.6)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">10</text>

              {/* Left arm (stretched out for balance) */}
              <path d="M110 175 Q80 190 55 195 Q48 196 46 190" stroke="white" strokeWidth="13" strokeLinecap="round" fill="none" />
              {/* Left hand */}
              <ellipse cx="44" cy="188" rx="8" ry="6" fill="#f5c5a3" />

              {/* Right arm (back) */}
              <path d="M150 178 Q172 170 188 162 Q194 158 196 152" stroke="white" strokeWidth="13" strokeLinecap="round" fill="none" />
              {/* Right hand */}
              <ellipse cx="197" cy="150" rx="7" ry="6" fill="#f5c5a3" />

              {/* Neck */}
              <rect x="122" y="143" width="16" height="20" rx="6" fill="#f5c5a3" />

              {/* Head */}
              <ellipse cx="130" cy="120" rx="30" ry="34" fill="#f5c5a3" />

              {/* Short hair — Mbappé style */}
              <path d="M100 110 Q102 80 130 78 Q158 78 160 110 Q155 92 130 90 Q105 92 100 110 Z" fill="#1a1008" />
              <path d="M100 108 Q97 95 100 85 Q103 78 110 76" stroke="#1a1008" strokeWidth="3" fill="none" />

              {/* Face features */}
              <ellipse cx="119" cy="118" rx="4" ry="5" fill="#2a1a0a" />
              <ellipse cx="141" cy="118" rx="4" ry="5" fill="#2a1a0a" />
              <path d="M122 130 Q130 136 138 130" stroke="#c0805a" strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Ear left */}
              <ellipse cx="100" cy="122" rx="5" ry="7" fill="#f5c5a3" />
              {/* Ear right */}
              <ellipse cx="160" cy="122" rx="5" ry="7" fill="#f5c5a3" />

              {/* Shorts */}
              <path d="M108 258 Q105 280 100 300 L120 302 Q125 282 130 268 Q135 282 140 302 L160 300 Q155 280 152 258 Z"
                fill="#1e3a8a" />

              {/* Socks */}
              <path d="M100 300 Q97 320 95 342" stroke="white" strokeWidth="14" strokeLinecap="round" fill="none" />
              <path d="M160 300 Q163 320 165 324" stroke="white" strokeWidth="14" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom content */}
      <main style={{ flex: 1, padding: '40px 24px 20px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 500 }}>
            Melde dich an und starte deine WM-Tippserie!
          </p>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', fontSize: 13, color: 'var(--muted)' }}>
        © {new Date().getFullYear()} WM-Tippspiel 2026 — Nur für den Schulgebrauch
      </footer>
    </div>
  )
}
