'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'

const SITEKEY = '0x4AAAAAADeNxYOS2NZIXGtC'

function getPasswordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

function PasswordChecklist({ password }: { password: string }) {
  const checks = getPasswordChecks(password)
  const items = [
    { key: 'length', label: 'Mindestens 8 Zeichen' },
    { key: 'upper', label: 'Großbuchstabe (A–Z)' },
    { key: 'lower', label: 'Kleinbuchstabe (a–z)' },
    { key: 'digit', label: 'Zahl (0–9)' },
    { key: 'special', label: 'Sonderzeichen (!@#$…)' },
  ] as const

  return (
    <ul className="mt-2 space-y-1">
      {items.map(({ key, label }) => {
        const ok = checks[key]
        return (
          <li key={key} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
            {label}
          </li>
        )
      })}
    </ul>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', code: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form & { general: string }>>({})
  const [loading, setLoading] = useState(false)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
    }
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (form.username.length < 3) errs.username = 'Mindestens 3 Zeichen'
    else if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) errs.username = 'Nur Buchstaben, Zahlen, _ und -'
    const checks = getPasswordChecks(form.password)
    if (!checks.length) errs.password = 'Mindestens 8 Zeichen erforderlich'
    else if (!checks.upper) errs.password = 'Mindestens ein Großbuchstabe erforderlich'
    else if (!checks.lower) errs.password = 'Mindestens ein Kleinbuchstabe erforderlich'
    else if (!checks.digit) errs.password = 'Mindestens eine Zahl erforderlich'
    else if (!checks.special) errs.password = 'Mindestens ein Sonderzeichen erforderlich'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwörter stimmen nicht überein'
    if (!form.code.trim()) errs.code = 'Zugangscode ist erforderlich'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!turnstileToken) {
      setErrors({ general: 'Bitte bestätige, dass du kein Roboter bist.' })
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          code: form.code.trim().toUpperCase(),
          turnstileToken,
        }),
      })

      const data = await res.json() as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        turnstileRef.current?.reset()
        setTurnstileToken(null)
        setErrors({ general: data.error ?? 'Registrierung fehlgeschlagen.' })
        return
      }

      router.push('/dashboard')
    } catch {
      setErrors({ general: 'Verbindungsfehler. Bitte erneut versuchen.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm animate-slide-up">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Konto erstellen
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Mitmachen beim WM-Tippspiel
        </p>
      </div>

      <div className="card p-6 shadow-sm">
        {errors.general && (
          <div className="mb-4">
            <Alert variant="error" message={errors.general} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Benutzername"
            type="text"
            value={form.username}
            onChange={update('username')}
            error={errors.username}
            autoComplete="username"
            autoFocus
            placeholder="dein-benutzername"
            hint="3–20 Zeichen, nur Buchstaben, Zahlen, _ und -"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
                className={`input-base pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Min. 8 Zeichen, Groß/Klein/Zahl/Sonderzeichen"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
            {form.password.length > 0 && <PasswordChecklist password={form.password} />}
          </div>

          <Input
            label="Passwort bestätigen"
            type="password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            error={errors.confirmPassword}
            autoComplete="new-password"
            placeholder="••••••••"
          />

          <Input
            label="Zugangscode"
            type="text"
            value={form.code}
            onChange={update('code')}
            error={errors.code}
            placeholder="z.B. ABCD1234"
            hint="Den Code erhältst du von deiner Lehrkraft"
            className="uppercase tracking-widest font-mono"
          />

          <Turnstile
            ref={turnstileRef}
            siteKey={SITEKEY}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ theme: 'auto', language: 'de' }}
          />

          <Button type="submit" className="w-full" loading={loading} disabled={!turnstileToken}>
            <UserPlus className="h-4 w-4" />
            Registrieren
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Bereits ein Konto?{' '}
        <Link href="/login" className="link font-medium">
          Jetzt anmelden
        </Link>
      </p>
    </div>
  )
}
