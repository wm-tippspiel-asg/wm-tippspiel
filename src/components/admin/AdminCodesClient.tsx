'use client'

import { useState } from 'react'
import { Plus, Copy, Check, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { RegistrationCode } from '@/types'

type CodeWithCreator = RegistrationCode & { created_by_username: string }

export function AdminCodesClient({ initialCodes }: { initialCodes: CodeWithCreator[] }) {
  const [codes, setCodes] = useState(initialCodes)
  const [showCreate, setShowCreate] = useState(false)
  const [newCodeResult, setNewCodeResult] = useState('')
  const [form, setForm] = useState({ description: '', max_uses: '', expires_at: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [deleteCode, setDeleteCode] = useState<CodeWithCreator | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function createCode(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setNewCodeResult('')

    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description || undefined,
          max_uses: form.max_uses ? parseInt(form.max_uses, 10) : undefined,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        }),
      })
      const d = await res.json() as { success: boolean; data?: { code: string }; error?: string }
      if (!d.success) { setFormError(d.error ?? 'Fehler'); return }

      setNewCodeResult(d.data?.code ?? '')
      setForm({ description: '', max_uses: '', expires_at: '' })

      const all = await fetch('/api/admin/codes').then((r) => r.json()) as { success: boolean; data: CodeWithCreator[] }
      if (all.success) setCodes(all.data)
    } catch {
      setFormError('Verbindungsfehler')
    } finally {
      setFormLoading(false)
    }
  }

  async function toggleCode(code: CodeWithCreator) {
    await fetch(`/api/admin/codes/${code.id}`, { method: 'PATCH' })
    const all = await fetch('/api/admin/codes').then((r) => r.json()) as { success: boolean; data: CodeWithCreator[] }
    if (all.success) setCodes(all.data)
  }

  async function doDelete() {
    if (!deleteCode) return
    setDeleteLoading(true)
    try {
      await fetch(`/api/admin/codes/${deleteCode.id}`, { method: 'DELETE' })
      setCodes((prev) => prev.filter((c) => c.id !== deleteCode.id))
      setDeleteCode(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setShowCreate(true); setNewCodeResult(''); setFormError('') }}>
          <Plus className="h-4 w-4" />
          Code generieren
        </Button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Beschreibung</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">Nutzungen</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Ablauf</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-sm tracking-wider">
                        {code.code}
                      </code>
                      <button
                        onClick={() => copyCode(code.code)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        title="Kopieren"
                      >
                        {copied === code.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                    {code.description ?? '–'}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500 text-xs">
                    {code.uses_count}{code.max_uses !== null ? `/${code.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                    {code.expires_at ? formatDate(code.expires_at) : '–'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={code.is_active ? 'green' : 'slate'}>
                      {code.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleCode(code)}
                        className="p-1.5 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                        title={code.is_active ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        {code.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteCode(code)}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Noch keine Zugangscodes erstellt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create code modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Zugangscode generieren">
        {newCodeResult && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">Neuer Code erstellt:</p>
            <div className="flex items-center gap-2">
              <code className="font-mono font-bold text-lg text-emerald-800 dark:text-emerald-300 tracking-widest">
                {newCodeResult}
              </code>
              <button onClick={() => copyCode(newCodeResult)} className="p-1 rounded text-emerald-600">
                {copied === newCodeResult ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {formError && <div className="mb-4"><Alert variant="error" message={formError} /></div>}

        <form onSubmit={createCode} className="space-y-4">
          <Input
            label="Beschreibung (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="z.B. Klasse 10a"
          />
          <Input
            label="Maximale Nutzungen (leer = unbegrenzt)"
            type="number"
            min={1}
            value={form.max_uses}
            onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))}
            placeholder="z.B. 30"
          />
          <Input
            label="Ablaufdatum (optional)"
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Schließen</Button>
            <Button type="submit" loading={formLoading}>Code erstellen</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteCode !== null}
        onClose={() => setDeleteCode(null)}
        onConfirm={doDelete}
        loading={deleteLoading}
        title={`Code "${deleteCode?.code}" löschen?`}
        description="Dieser Code kann danach nicht mehr zur Registrierung verwendet werden."
        confirmLabel="Code löschen"
      />
    </>
  )
}
