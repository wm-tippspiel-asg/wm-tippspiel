'use client'

import { useState } from 'react'
import { Plus, Trash2, Users, ChevronDown, ChevronUp, UserMinus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import type { UserGroup, UserGroupMember } from '@/types'

type GroupWithCount = UserGroup & { member_count: number }

interface Props {
  initialGroups: GroupWithCount[]
  allUsers: { id: string; username: string }[]
}

export function AdminGroupsClient({ initialGroups, allUsers }: Props) {
  const [groups, setGroups] = useState(initialGroups)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [membersMap, setMembersMap] = useState<Record<string, UserGroupMember[]>>({})
  const [membersLoading, setMembersLoading] = useState<string | null>(null)

  // Create group modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Delete group
  const [deleteGroup, setDeleteGroup] = useState<GroupWithCount | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Add member
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [addUserId, setAddUserId] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Remove member
  const [removingMember, setRemovingMember] = useState<{ groupId: string; userId: string; username: string } | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  async function reloadGroups() {
    const r = await fetch('/api/admin/user-groups')
    const d = await r.json() as { success: boolean; data: GroupWithCount[] }
    if (d.success) setGroups(d.data)
  }

  async function toggleExpand(groupId: string) {
    if (expandedId === groupId) {
      setExpandedId(null)
      return
    }
    setExpandedId(groupId)
    if (!membersMap[groupId]) {
      setMembersLoading(groupId)
      const r = await fetch(`/api/admin/user-groups/${groupId}/members`)
      const d = await r.json() as { success: boolean; data: UserGroupMember[] }
      if (d.success) setMembersMap((prev) => ({ ...prev, [groupId]: d.data }))
      setMembersLoading(null)
    }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    const r = await fetch('/api/admin/user-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: createForm.name, description: createForm.description || undefined }),
    })
    const d = await r.json() as { success: boolean; error?: string }
    if (!d.success) { setCreateError(d.error ?? 'Fehler'); setCreateLoading(false); return }
    setCreateForm({ name: '', description: '' })
    setShowCreate(false)
    await reloadGroups()
    setCreateLoading(false)
  }

  async function doDeleteGroup() {
    if (!deleteGroup) return
    setDeleteLoading(true)
    await fetch(`/api/admin/user-groups/${deleteGroup.id}`, { method: 'DELETE' })
    setDeleteGroup(null)
    setDeleteLoading(false)
    if (expandedId === deleteGroup.id) setExpandedId(null)
    await reloadGroups()
  }

  async function addMember(groupId: string) {
    if (!addUserId) return
    setAddLoading(true)
    setAddError('')
    const r = await fetch(`/api/admin/user-groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: addUserId }),
    })
    const d = await r.json() as { success: boolean; error?: string }
    if (!d.success) { setAddError(d.error ?? 'Fehler'); setAddLoading(false); return }
    setAddUserId('')
    setAddingTo(null)
    setAddLoading(false)
    // Reload members for this group
    const r2 = await fetch(`/api/admin/user-groups/${groupId}/members`)
    const d2 = await r2.json() as { success: boolean; data: UserGroupMember[] }
    if (d2.success) setMembersMap((prev) => ({ ...prev, [groupId]: d2.data }))
    await reloadGroups()
  }

  async function doRemoveMember() {
    if (!removingMember) return
    setRemoveLoading(true)
    await fetch(`/api/admin/user-groups/${removingMember.groupId}/members/${removingMember.userId}`, { method: 'DELETE' })
    setMembersMap((prev) => ({
      ...prev,
      [removingMember.groupId]: (prev[removingMember.groupId] ?? []).filter((m) => m.user_id !== removingMember.userId),
    }))
    setRemovingMember(null)
    setRemoveLoading(false)
    await reloadGroups()
  }

  const membersInGroup = (groupId: string) => new Set((membersMap[groupId] ?? []).map((m) => m.user_id))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Neue Gruppe
        </Button>
      </div>

      {groups.length === 0 && (
        <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
          Noch keine Gruppen. Erstelle die erste Gruppe!
        </div>
      )}

      <div className="space-y-3">
        {groups.map((g) => {
          const isExpanded = expandedId === g.id
          const members = membersMap[g.id] ?? []
          const loading = membersLoading === g.id
          const memberIds = membersInGroup(g.id)
          const availableUsers = allUsers.filter((u) => !memberIds.has(u.id))

          return (
            <div key={g.id} className="card overflow-hidden">
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleExpand(g.id)}
              >
                <Users className="h-4 w-4 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{g.name}</div>
                  {g.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{g.description}</div>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  {g.member_count} Mitglied{g.member_count !== 1 ? 'er' : ''}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteGroup(g) }}
                  className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-4 space-y-4">
                  {/* Member list */}
                  {loading ? (
                    <p className="text-sm text-slate-500">Lädt…</p>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Noch keine Mitglieder.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {members.map((m) => (
                        <li key={m.user_id} className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.username}</span>
                          <button
                            onClick={() => setRemovingMember({ groupId: g.id, userId: m.user_id, username: m.username })}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Entfernen
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add member */}
                  {addingTo === g.id ? (
                    <div className="space-y-2">
                      {addError && <Alert variant="error" message={addError} />}
                      <div className="flex gap-2">
                        <select
                          value={addUserId}
                          onChange={(e) => setAddUserId(e.target.value)}
                          className="input-base flex-1 text-sm"
                        >
                          <option value="">Nutzer auswählen…</option>
                          {availableUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                        <Button size="sm" onClick={() => addMember(g.id)} loading={addLoading} disabled={!addUserId}>
                          Hinzufügen
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => { setAddingTo(null); setAddError('') }}>
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTo(g.id); setAddUserId('') }}
                      className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Nutzer hinzufügen
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Neue Gruppe erstellen">
        {createError && <div className="mb-4"><Alert variant="error" message={createError} /></div>}
        <form onSubmit={createGroup} className="space-y-4">
          <Input
            label="Name"
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="z.B. Klasse 10a"
            autoFocus
          />
          <Input
            label="Beschreibung (optional)"
            value={createForm.description}
            onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="z.B. Mathe-Leistungskurs"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            <Button type="submit" loading={createLoading} disabled={createForm.name.trim().length < 2}>Erstellen</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteGroup !== null}
        onClose={() => setDeleteGroup(null)}
        onConfirm={doDeleteGroup}
        loading={deleteLoading}
        title={`Gruppe "${deleteGroup?.name}" löschen?`}
        description="Alle Mitgliedschaften werden ebenfalls gelöscht. Die Tipps der Nutzer bleiben erhalten."
      />

      {/* Remove member confirm */}
      <ConfirmModal
        open={removingMember !== null}
        onClose={() => setRemovingMember(null)}
        onConfirm={doRemoveMember}
        loading={removeLoading}
        title={`${removingMember?.username} entfernen?`}
        description="Der Nutzer wird aus der Gruppe entfernt. Seine Tipps und Punkte bleiben unverändert."
      />
    </div>
  )
}
