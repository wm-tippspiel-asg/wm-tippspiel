'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, Lock, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { formatDateTime, getRoundLabel } from '@/lib/utils'
import type { Match, MatchRound } from '@/types'

const ROUNDS: MatchRound[] = ['group', 'round_of_16', 'round_of_8', 'quarter_final', 'semi_final', 'final']

type MatchFormData = {
  home_team: string
  away_team: string
  home_team_flag: string
  away_team_flag: string
  match_time: string
  round: MatchRound
  group_name: string
  venue: string
}

const emptyForm: MatchFormData = {
  home_team: '', away_team: '', home_team_flag: '', away_team_flag: '',
  match_time: '', round: 'group', group_name: '', venue: '',
}

interface AdminMatchesClientProps {
  initialMatches: Match[]
}

export function AdminMatchesClient({ initialMatches }: AdminMatchesClientProps) {
  const [matches, setMatches] = useState(initialMatches)
  const [showForm, setShowForm] = useState(false)
  const [editMatch, setEditMatch] = useState<Match | null>(null)
  const [form, setForm] = useState<MatchFormData>(emptyForm)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Result form
  const [resultMatch, setResultMatch] = useState<Match | null>(null)
  const [resultHome, setResultHome] = useState('')
  const [resultAway, setResultAway] = useState('')
  const [resultStatus, setResultStatus] = useState<'live' | 'finished'>('finished')
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState('')

  // Delete
  const [deleteMatch, setDeleteMatch] = useState<Match | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function openCreate() {
    setForm(emptyForm)
    setEditMatch(null)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(match: Match) {
    setForm({
      home_team: match.home_team,
      away_team: match.away_team,
      home_team_flag: match.home_team_flag ?? '',
      away_team_flag: match.away_team_flag ?? '',
      match_time: match.match_time.slice(0, 16),
      round: match.round,
      group_name: match.group_name ?? '',
      venue: match.venue ?? '',
    })
    setEditMatch(match)
    setFormError('')
    setShowForm(true)
  }

  function update(field: keyof MatchFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    const payload = {
      ...form,
      match_time: new Date(form.match_time).toISOString(),
      home_team_flag: form.home_team_flag || null,
      away_team_flag: form.away_team_flag || null,
      group_name: form.group_name || null,
      venue: form.venue || null,
    }

    try {
      const url = editMatch ? `/api/admin/matches/${editMatch.id}` : '/api/admin/matches'
      const method = editMatch ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json() as { success: boolean; error?: string }
      if (!d.success) { setFormError(d.error ?? 'Fehler'); return }

      // Refresh
      const all = await fetch('/api/admin/matches').then((r) => r.json()) as { success: boolean; data: Match[] }
      if (all.success) setMatches(all.data)
      setShowForm(false)
    } catch {
      setFormError('Verbindungsfehler')
    } finally {
      setFormLoading(false)
    }
  }

  async function submitResult(e: React.FormEvent) {
    e.preventDefault()
    if (!resultMatch) return
    setResultLoading(true)
    setResultError('')

    const h = parseInt(resultHome, 10)
    const a = parseInt(resultAway, 10)
    if (isNaN(h) || isNaN(a)) { setResultError('Ungültige Zahlen'); setResultLoading(false); return }

    try {
      const res = await fetch(`/api/admin/matches/${resultMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_score: h, away_score: a, status: resultStatus }),
      })
      const d = await res.json() as { success: boolean; error?: string }
      if (!d.success) { setResultError(d.error ?? 'Fehler'); return }

      const all = await fetch('/api/admin/matches').then((r) => r.json()) as { success: boolean; data: Match[] }
      if (all.success) setMatches(all.data)
      setResultMatch(null)
    } catch {
      setResultError('Verbindungsfehler')
    } finally {
      setResultLoading(false)
    }
  }

  async function toggleLock(match: Match) {
    const action = match.status === 'locked' ? 'unlock' : 'lock'
    await fetch(`/api/admin/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const all = await fetch('/api/admin/matches').then((r) => r.json()) as { success: boolean; data: Match[] }
    if (all.success) setMatches(all.data)
  }

  async function doDelete() {
    if (!deleteMatch) return
    setDeleteLoading(true)
    try {
      await fetch(`/api/admin/matches/${deleteMatch.id}`, { method: 'DELETE' })
      setMatches((prev) => prev.filter((m) => m.id !== deleteMatch.id))
      setDeleteMatch(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const statusVariant: Record<string, 'green' | 'yellow' | 'slate' | 'red' | 'blue'> = {
    scheduled: 'slate', live: 'green', finished: 'blue', locked: 'yellow', cancelled: 'red',
  }
  const statusLabel: Record<string, string> = {
    scheduled: 'Geplant', live: 'Live', finished: 'Beendet', locked: 'Gesperrt', cancelled: 'Abgesagt',
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Spiel hinzufügen
        </Button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Spiel</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Runde</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Zeitpunkt</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">Ergebnis</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {match.home_team_flag} {match.home_team} vs {match.away_team} {match.away_team_flag}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell text-xs">
                    {getRoundLabel(match.round)}
                    {match.group_name && ` · Gr. ${match.group_name}`}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                    {formatDateTime(match.match_time)}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-semibold">
                    {match.home_score !== null
                      ? `${match.home_score}:${match.away_score}`
                      : '–:–'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[match.status] ?? 'slate'}>
                      {statusLabel[match.status] ?? match.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Ergebnis eintragen"
                        onClick={() => {
                          setResultMatch(match)
                          setResultHome(match.home_score !== null ? String(match.home_score) : '')
                          setResultAway(match.away_score !== null ? String(match.away_score) : '')
                          setResultStatus(match.status === 'live' ? 'live' : 'finished')
                          setResultError('')
                        }}
                        className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        title={match.status === 'locked' ? 'Entsperren' : 'Sperren'}
                        onClick={() => toggleLock(match)}
                        className="p-1.5 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                      >
                        {match.status === 'locked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                      <button
                        title="Bearbeiten"
                        onClick={() => openEdit(match)}
                        className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        title="Löschen"
                        onClick={() => setDeleteMatch(match)}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {matches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Noch keine Spiele eingetragen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit form modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editMatch ? 'Spiel bearbeiten' : 'Neues Spiel'}
      >
        {formError && <div className="mb-4"><Alert variant="error" message={formError} /></div>}
        <form onSubmit={submitForm} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Heimteam" value={form.home_team} onChange={update('home_team')} required placeholder="Deutschland" />
            <Input label="Auswärtsteam" value={form.away_team} onChange={update('away_team')} required placeholder="Frankreich" />
            <Input label="Flagge Heim (Emoji)" value={form.home_team_flag} onChange={update('home_team_flag')} placeholder="🇩🇪" />
            <Input label="Flagge Auswärts" value={form.away_team_flag} onChange={update('away_team_flag')} placeholder="🇫🇷" />
          </div>

          <Input label="Anpfiff" type="datetime-local" value={form.match_time} onChange={update('match_time')} required />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Runde</label>
              <select
                value={form.round}
                onChange={update('round') as React.ChangeEventHandler<HTMLSelectElement>}
                className="input-base"
              >
                {ROUNDS.map((r) => (
                  <option key={r} value={r}>{getRoundLabel(r)}</option>
                ))}
              </select>
            </div>
            <Input label="Gruppe (optional)" value={form.group_name} onChange={update('group_name')} placeholder="A" />
          </div>

          <Input label="Spielort (optional)" value={form.venue} onChange={update('venue')} placeholder="Berlin, Olympiastadion" />

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            <Button type="submit" loading={formLoading}>{editMatch ? 'Speichern' : 'Hinzufügen'}</Button>
          </div>
        </form>
      </Modal>

      {/* Result modal */}
      <Modal open={resultMatch !== null} onClose={() => setResultMatch(null)} title="Ergebnis eintragen"
        description={resultMatch ? `${resultMatch.home_team_flag ?? ''} ${resultMatch.home_team} vs ${resultMatch.away_team} ${resultMatch.away_team_flag ?? ''}` : ''}>
        {resultError && <div className="mb-4"><Alert variant="error" message={resultError} /></div>}
        <form onSubmit={submitResult} className="space-y-5">
          {/* Score inputs */}
          <div className="flex items-center gap-4 justify-center">
            <div className="space-y-1 text-center">
              <p className="text-xs text-slate-500 font-medium">{resultMatch?.home_team}</p>
              <input
                type="number" min={0} max={99} value={resultHome}
                onChange={(e) => setResultHome(e.target.value)}
                className="score-input" placeholder="0" required
              />
            </div>
            <span className="text-2xl font-bold text-slate-400 mt-4">:</span>
            <div className="space-y-1 text-center">
              <p className="text-xs text-slate-500 font-medium">{resultMatch?.away_team}</p>
              <input
                type="number" min={0} max={99} value={resultAway}
                onChange={(e) => setResultAway(e.target.value)}
                className="score-input" placeholder="0" required
              />
            </div>
          </div>

          {/* Status selector */}
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => setResultStatus('live')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                resultStatus === 'live'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${resultStatus === 'live' ? 'bg-white' : 'bg-red-400'}`} />
              Live
            </button>
            <button
              type="button"
              onClick={() => setResultStatus('finished')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                resultStatus === 'finished'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'
              }`}
            >
              Beendet
            </button>
          </div>
          {resultStatus === 'finished' && (
            <p className="text-xs text-slate-400 text-center -mt-2">
              Punkte werden automatisch berechnet.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setResultMatch(null)}>Abbrechen</Button>
            <Button type="submit" loading={resultLoading}>Speichern</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteMatch !== null}
        onClose={() => setDeleteMatch(null)}
        onConfirm={doDelete}
        loading={deleteLoading}
        title={`Spiel "${deleteMatch?.home_team} vs ${deleteMatch?.away_team}" löschen?`}
        description="Alle Tipps zu diesem Spiel werden ebenfalls gelöscht."
        confirmLabel="Endgültig löschen"
      />
    </>
  )
}
