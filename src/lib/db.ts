import { getRequestContext } from '@cloudflare/next-on-pages'
import type { CloudflareEnv } from '@/types'

export function getDb(): D1Database {
  const ctx = getRequestContext<CloudflareEnv>()
  return ctx.env.DB
}

export function getKv(): KVNamespace {
  const ctx = getRequestContext<CloudflareEnv>()
  return ctx.env.RATE_LIMIT
}

export function getSecret(): string {
  const ctx = getRequestContext<CloudflareEnv>()
  const secret = ctx.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not configured')
  return secret
}

// Typed D1 query helpers
export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params)
  const result = await stmt.first<T>()
  return result ?? null
}

export async function queryAll<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...params)
  const result = await stmt.all<T>()
  return result.results
}

export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run()
}
