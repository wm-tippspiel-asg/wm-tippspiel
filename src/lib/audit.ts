import { getDb, execute } from './db'

export type AuditAction =
  | 'user.created'
  | 'user.login'
  | 'user.logout'
  | 'user.banned'
  | 'user.unbanned'
  | 'user.deleted'
  | 'user.password_changed'
  | 'user.profile_updated'
  | 'match.created'
  | 'match.updated'
  | 'match.deleted'
  | 'match.result_set'
  | 'match.locked'
  | 'code.created'
  | 'code.deactivated'
  | 'code.deleted'
  | 'code.used'
  | 'prediction.created'
  | 'prediction.updated'
  | 'leaderboard.recalculated'
  | 'admin.setup'

interface AuditOptions {
  actorId?: string | null
  actorName: string
  action: AuditAction
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

export async function audit(options: AuditOptions): Promise<void> {
  try {
    const db = getDb()
    await execute(
      db,
      `INSERT INTO audit_logs (actor_id, actor_name, action, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        options.actorId ?? null,
        options.actorName,
        options.action,
        options.targetType ?? null,
        options.targetId ?? null,
        options.details ? JSON.stringify(options.details) : null,
        options.ipAddress ?? null,
      ],
    )
  } catch (err) {
    // Audit failures must not break the main flow
    console.error('Audit log failed:', err)
  }
}
