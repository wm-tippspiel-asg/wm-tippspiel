'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', code: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form & { general: string }>>({})
  const [loading, setLoading] = useState(false)

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
    if (form.password.length < 8) errs.password = 'Mindestens 8 Zeichen'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwörter stimmen nicht überein'
    if (!form.code.trim()) errs.code = 'Zugangscode ist erforderlich'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          code: form.code.trim().toUpperCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
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
                placeholder="Mindestens 8 Zeichen"
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

          <Button type="submit" className="w-full" loading={loading}>
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
