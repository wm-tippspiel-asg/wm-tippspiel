'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'

const SITEKEY = '0x4AAAAAADeNxYOS2NZIXGtC'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [banned, setBanned] = useState(false)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('banned') === '1') setBanned(true)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!turnstileToken) { setError('Bitte bestätige, dass du kein Roboter bist.'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, turnstileToken }),
      })
      const d = await res.json() as { success: boolean; data?: { role: string }; error?: string }
      if (!d.success) {
        turnstileRef.current?.reset()
        setTurnstileToken(null)
        setError(d.error ?? 'Ungültige Anmeldedaten.')
        return
      }
      router.push(d.data?.role === 'admin' ? '/admin' : '/dashboard')
    } catch { setError('Verbindungsfehler.') } finally { setLoading(false) }
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }} className="wm-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)', margin: 0 }}>
          Anmelden
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--muted)', fontWeight: 500 }}>
          Melde dich an, um mitzuspielen
        </p>
      </div>

      <div className="wm-card" style={{ padding: '28px 28px' }}>
        {(banned || error) && (
          <div style={{ marginBottom: 20, padding: '13px 16px', borderRadius: 12,
            background: 'color-mix(in oklab, var(--live) 10%, var(--bg))',
            border: '1px solid color-mix(in oklab, var(--live) 30%, var(--bg))',
            color: 'var(--live)', fontSize: 14, fontWeight: 600 }}>
            {banned ? 'Dein Konto wurde gesperrt. Bitte wende dich an einen Admin.' : error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'grid', gap: 18 }} noValidate>
          <div>
            <label className="label">Benutzername</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="input-base" autoFocus autoComplete="username" placeholder="dein-benutzername" />
          </div>

          <div>
            <label className="label">Passwort</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base" style={{ paddingRight: 48 }}
                autoComplete="current-password" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  border: 0, background: 'transparent', color: 'var(--muted)', cursor: 'pointer', padding: 2 }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Turnstile
            ref={turnstileRef}
            siteKey={SITEKEY}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ theme: 'auto', language: 'de' }}
          />

          <button type="submit" className="wm-btn wm-btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Einen Moment…' : 'Anmelden'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
        Noch kein Konto?{' '}
        <Link href="/register" className="link">Jetzt registrieren</Link>
      </p>
    </div>
  )
}
