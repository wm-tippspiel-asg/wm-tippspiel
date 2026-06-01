-- ============================================================
-- WM-Tippspiel Database Schema
-- Migration: 0001_initial
-- ============================================================

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username    TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email       TEXT UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_banned   INTEGER NOT NULL DEFAULT 0 CHECK (is_banned IN (0, 1)),
  ban_reason  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  last_login  TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(32)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================
-- Registration Codes
-- ============================================================
CREATE TABLE IF NOT EXISTS registration_codes (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  code         TEXT NOT NULL UNIQUE,
  description  TEXT,
  max_uses     INTEGER,
  uses_count   INTEGER NOT NULL DEFAULT 0,
  expires_at   TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_by   TEXT NOT NULL REFERENCES users(id),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_codes_code ON registration_codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_active ON registration_codes(is_active);

-- Track which user used which code
CREATE TABLE IF NOT EXISTS code_uses (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  code_id    TEXT NOT NULL REFERENCES registration_codes(id),
  user_id    TEXT NOT NULL REFERENCES users(id),
  used_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(code_id, user_id)
);

-- ============================================================
-- Matches
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  home_team     TEXT NOT NULL,
  away_team     TEXT NOT NULL,
  home_team_flag TEXT,
  away_team_flag TEXT,
  match_time    TEXT NOT NULL,  -- ISO 8601 datetime
  round         TEXT NOT NULL CHECK (round IN (
    'group', 'round_of_16', 'round_of_8', 'quarter_final', 'semi_final', 'final'
  )),
  group_name    TEXT,           -- 'A', 'B', ... for group stage
  venue         TEXT,
  home_score    INTEGER,        -- NULL = not played yet
  away_score    INTEGER,
  status        TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'live', 'finished', 'cancelled', 'locked'
  )),
  locked_at     TEXT,           -- set when predictions are locked
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_matches_match_time ON matches(match_time);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);

-- ============================================================
-- Predictions (Tipps)
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id     TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score   INTEGER NOT NULL CHECK (home_score >= 0),
  away_score   INTEGER NOT NULL CHECK (away_score >= 0),
  points       INTEGER,         -- NULL = not yet calculated
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);

-- ============================================================
-- Leaderboard (materialized for performance)
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  total_points    INTEGER NOT NULL DEFAULT 0,
  exact_results   INTEGER NOT NULL DEFAULT 0,
  correct_diff    INTEGER NOT NULL DEFAULT 0,
  correct_winner  INTEGER NOT NULL DEFAULT 0,
  total_tips      INTEGER NOT NULL DEFAULT 0,
  rank            INTEGER,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_total_points ON leaderboard(total_points DESC);

-- ============================================================
-- Audit Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  actor_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_name  TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT,    -- 'user', 'match', 'code', 'prediction'
  target_id   TEXT,
  details     TEXT,    -- JSON blob with extra context
  ip_address  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- Scoring Config (allows admin to adjust points)
-- ============================================================
CREATE TABLE IF NOT EXISTS scoring_config (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  label TEXT NOT NULL
);

INSERT OR IGNORE INTO scoring_config (key, value, label) VALUES
  ('exact_result',            5, 'Exaktes Ergebnis'),
  ('correct_diff_and_winner', 3, 'Richtige Differenz + Gewinner'),
  ('correct_winner',          2, 'Richtiger Gewinner/Unentschieden');
