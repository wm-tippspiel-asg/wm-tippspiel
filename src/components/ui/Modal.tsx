'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div onClick={onClose} aria-hidden
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

      {/* Dialog */}
      <div role="dialog" aria-modal aria-labelledby="modal-title"
        className="wm-card wm-fade-in"
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 id="modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: 16,
              fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              {title}
            </h2>
            {description && (
              <p style={{ marginTop: 4, fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                {description}
              </p>
            )}
          </div>
          <button onClick={onClose} aria-label="Schließen"
            style={{ border: 0, background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
              padding: 4, borderRadius: 6, flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px' }}>{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Bestätigen', confirmVariant = 'danger', loading }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
  loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="wm-btn wm-btn-ghost" onClick={onClose} disabled={loading}
          style={{ padding: '9px 16px', fontSize: 14 }}>
          Abbrechen
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="wm-btn"
          style={{
            padding: '9px 16px', fontSize: 14,
            background: confirmVariant === 'danger' ? 'var(--live)' : 'var(--accent)',
            color: '#fff', opacity: loading ? 0.6 : 1,
          }}>
          {loading ? 'Bitte warten…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
