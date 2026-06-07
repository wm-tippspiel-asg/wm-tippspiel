import { getKv } from './db'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

interface RLEntry { count: number; window_start: number }

// Read-only check — no KV write. Use this before processing a request.
async function checkRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const kv = getKv()
  const key = `rl:${action}:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - windowSeconds

  const stored = await kv.get<RLEntry>(key, 'json')
  if (!stored || stored.window_start <= windowStart) {
    return { allowed: true, remaining: limit - 1, resetAt: now + windowSeconds }
  }

  const count = stored.count
  if (count >= limit) {
    return { allowed: false, remaining: 0, resetAt: stored.window_start + windowSeconds }
  }
  return { allowed: true, remaining: limit - count, resetAt: stored.window_start + windowSeconds }
}

// Write-only increment — call this only when an attempt actually fails.
async function recordFailedAttempt(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const kv = getKv()
  const key = `rl:${action}:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - windowSeconds

  const stored = await kv.get<RLEntry>(key, 'json')
  const base = stored && stored.window_start > windowStart ? stored : { count: 0, window_start: now }
  const next: RLEntry = { count: Math.min(base.count + 1, limit), window_start: base.window_start }
  await kv.put(key, JSON.stringify(next), { expirationTtl: windowSeconds + 60 })
}

export async function rateLimitLogin(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, 'login', 10, 60 * 15)
}

export async function recordFailedLogin(ip: string): Promise<void> {
  return recordFailedAttempt(ip, 'login', 10, 60 * 15)
}

export async function rateLimitRegister(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, 'register', 5, 60 * 60)
}

export async function recordFailedRegister(ip: string): Promise<void> {
  return recordFailedAttempt(ip, 'register', 5, 60 * 60)
}
