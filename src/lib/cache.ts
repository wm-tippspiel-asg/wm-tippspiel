import { getKv } from './db'

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await getKv().get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCached<T>(key: string, data: T, ttlSeconds = 60): Promise<void> {
  try {
    await getKv().put(key, JSON.stringify(data), { expirationTtl: ttlSeconds })
  } catch {
    // Cache-Fehler dürfen den Hauptfluss nicht unterbrechen
  }
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  try {
    await Promise.all(keys.map(k => getKv().delete(k)))
  } catch {
    // ignore
  }
}

export const CACHE_KEYS = {
  LEADERBOARD_ALL: 'cache:leaderboard:all',
  LEADERBOARD_GROUPS: 'cache:leaderboard:groups',
  MATCHES_UPCOMING: 'cache:matches:upcoming',
} as const
