// ============================================================
// Domain Types
// ============================================================

export type UserRole = 'admin' | 'user'
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled' | 'locked'
export type MatchRound = 'group' | 'round_of_16' | 'round_of_8' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'

export interface User {
  id: string
  username: string
  email: string | null
  role: UserRole
  is_banned: boolean
  ban_reason: string | null
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface Session {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  created_at: string
  ip_address: string | null
  user_agent: string | null
}

export interface RegistrationCode {
  id: string
  code: string
  description: string | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  created_by: string
  created_at: string
}

export interface Match {
  id: string
  home_team: string
  away_team: string
  home_team_flag: string | null
  away_team_flag: string | null
  match_time: string
  round: MatchRound
  group_name: string | null
  venue: string | null
  home_score: number | null
  away_score: number | null
  status: MatchStatus
  locked_at: string | null
  score_locked: number
  created_at: string
  updated_at: string
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  points: number | null
  created_at: string
  updated_at: string
}

export interface PredictionWithMatch extends Prediction {
  match: Match
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  total_points: number
  exact_results: number
  correct_diff: number
  correct_winner: number
  total_tips: number
  rank: number | null
  updated_at: string
}

export interface UserGroup {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  member_count?: number
}

export interface UserGroupMember {
  user_id: string
  username: string
  group_id: string
  added_at: string
}

export interface GroupStanding {
  id: string
  name: string
  description: string | null
  member_count: number
  total_points: number
  exact_results: number
  avg_points: number
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_name: string
  action: string
  target_type: string | null
  target_id: string | null
  details: string | null
  ip_address: string | null
  created_at: string
}

export interface ScoringConfig {
  exact_result: number
  correct_diff_and_winner: number
  correct_winner: number
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ============================================================
// Auth Types
// ============================================================

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  is_banned: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterCredentials {
  username: string
  password: string
  code: string
}

// ============================================================
// Cloudflare Env Bindings
// ============================================================

export interface CloudflareEnv {
  DB: D1Database
  RATE_LIMIT: KVNamespace
  SESSION_SECRET: string
  FOOTBALL_API_KEY?: string
  CRON_SECRET?: string
  NODE_ENV?: string
  NEXT_PUBLIC_APP_URL?: string
}
