'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { User, Lock, Calendar, Trophy } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ProfileData {
  user: {
    id: string
    username: string
    role: string
    created_at: string
    last_login: string | null
  }
  stats: {
    total_tips: number
    total_points: number
    exact_results: number
  }
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Username form
  const [newUsername, setNewUsername] = useState('')
  const [usernameMsg, setUsernameMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [usernameLoading, setUsernameLoading] = useState(false)

  // Password form
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json() as Promise<{ success: boolean; data?: ProfileData }>)
      .then((d) => {
        if (d.success) {
          setData(d.data ?? null)
          setNewUsername(d.data?.user.username ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleUsernameUpdate(e: React.FormEvent) {
    e.preventDefault()
    setUsernameLoading(true)
    setUsernameMsg(null)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername }),
    })
    const d = await res.json() as { success: boolean; message?: string; error?: string }
    setUsernameMsg({ type: d.success ? 'success' : 'error', text: d.message ?? d.error ?? '' })
    if (d.success && data) {
      setData({ ...data, user: { ...data.user, username: newUsername } })
    }
    setUsernameLoading(false)
  }

  function validateNewPassword(pw: string): string | null {
    if (pw.length < 8) return 'Mindestens 8 Zeichen erforderlich'
    if (!/[A-Z]/.test(pw)) return 'Mindestens ein Großbuchstabe erforderlich'
    if (!/[a-z]/.test(pw)) return 'Mindestens ein Kleinbuchstabe erforderlich'
    if (!/[0-9]/.test(pw)) return 'Mindestens eine Zahl erforderlich'
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Mindestens ein Sonderzeichen erforderlich'
    return null
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    const pwError = validateNewPassword(passwords.new)
    if (pwError) {
      setPasswordMsg({ type: 'error', text: pwError })
      return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg({ type: 'error', text: 'Passwörter stimmen nicht überein.' })
      return
    }
    setPasswordLoading(true)
    setPasswordMsg(null)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: passwords.current,
        new_password: passwords.new,
        confirm_password: passwords.confirm,
      }),
    })
    const d = await res.json() as { success: boolean; message?: string; error?: string }
    setPasswordMsg({ type: d.success ? 'success' : 'error', text: d.message ?? d.error ?? '' })
    if (d.success) setPasswords({ current: '', new: '', confirm: '' })
    setPasswordLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <h1 className="page-title">Mein Profil</h1>

      {/* Account info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <span className="section-title text-base">Konto-Informationen</span>
          </div>
        </CardHeader>
        <CardBody>
          <dl className="grid sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Benutzername</dt>
              <dd className="mt-0.5 font-medium">{data.user.username}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Rolle</dt>
              <dd className="mt-0.5 font-medium capitalize">{data.user.role}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />Registriert
              </dt>
              <dd className="mt-0.5 text-sm">{formatDate(data.user.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Trophy className="h-3 w-3" />Punkte
              </dt>
              <dd className="mt-0.5 font-bold text-indigo-600 dark:text-indigo-400">
                {data.stats.total_points}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {/* Change username */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <span className="section-title text-base">Benutzername ändern</span>
          </div>
        </CardHeader>
        <CardBody>
          {usernameMsg && (
            <div className="mb-4">
              <Alert variant={usernameMsg.type === 'error' ? 'error' : 'success'} message={usernameMsg.text} />
            </div>
          )}
          <form onSubmit={handleUsernameUpdate} className="space-y-4">
            <Input
              label="Neuer Benutzername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="dein-benutzername"
              hint="3–20 Zeichen, nur Buchstaben, Zahlen, _ und -"
            />
            <Button type="submit" variant="secondary" loading={usernameLoading}>
              Benutzername speichern
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" />
            <span className="section-title text-base">Passwort ändern</span>
          </div>
        </CardHeader>
        <CardBody>
          {passwordMsg && (
            <div className="mb-4">
              <Alert variant={passwordMsg.type === 'error' ? 'error' : 'success'} message={passwordMsg.text} />
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Aktuelles Passwort"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              autoComplete="current-password"
            />
            <Input
              label="Neues Passwort"
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
              autoComplete="new-password"
              hint="Mindestens 8 Zeichen"
            />
            <Input
              label="Neues Passwort bestätigen"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              autoComplete="new-password"
            />
            <Button type="submit" variant="secondary" loading={passwordLoading}>
              Passwort ändern
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
