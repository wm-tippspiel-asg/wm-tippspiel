import { getKv } from './db'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// Sliding window rate limiter using Cloudflare KV
export async function rateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const kv = getKv()
  const key = `rl:${action}:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - windowSeconds

  // Get current count from KV
  const stored = await kv.get<{ count: number; window_start: number }>(key, 'json')

  let count = 0
  let windowStartActual = now

  if (stored && stored.window_start > windowStart) {
    count = stored.count
    windowStartActual = stored.window_start
  }

  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowStartActual + windowSeconds,
    }
  }

  // Increment count
  await kv.put(
    key,
    JSON.stringify({ count: count + 1, window_start: windowStartActual }),
    { expirationTtl: windowSeconds + 60 },
  )

  return {
    allowed: true,
    remaining: limit - count - 1,
    resetAt: windowStartActual + windowSeconds,
  }
}

// Convenience wrappers for common actions
export async function rateLimitLogin(ip: string): Promise<RateLimitResult> {
  return rateLimit(ip, 'login', 10, 60 * 15) // 10 attempts per 15 minutes
}

export async function rateLimitRegister(ip: string): Promise<RateLimitResult> {
  return rateLimit(ip, 'register', 5, 60 * 60) // 5 per hour
}

export async function rateLimitApi(ip: string): Promise<RateLimitResult> {
  return rateLimit(ip, 'api', 100, 60) // 100 per minute
}
