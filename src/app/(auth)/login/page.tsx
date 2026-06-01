'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [banned, setBanned] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('banned') === '1') setBanned(true)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const d = await res.json() as { success: boolean; data?: { role: string }; error?: string }
      if (!d.success) { setError(d.error ?? 'Ungültige Anmeldedaten.'); return }
      router.push(d.data?.role === 'admin' ? '/admin' : '/dashboard')
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.')
    } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-md slide-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Anmelden</h1>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
          Melde dich an um mitzuspielen
        </p>
      </div>

      <div className="card p-8">
        {banned && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-base">
            Dein Konto wurde gesperrt. Bitte wende dich an einen Admin.
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-base">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5" noValidate>
          <Input label="Benutzername" type="text" value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username" autoFocus required placeholder="dein-benutzername" />

          <div className="space-y-1.5">
            <label className="label">Passwort</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" required
                className="input-base pr-12" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Anmelden
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-base text-gray-500 dark:text-gray-400">
        Noch kein Konto?{' '}
        <Link href="/register" className="link font-semibold">Jetzt registrieren</Link>
      </p>
    </div>
  )
}
