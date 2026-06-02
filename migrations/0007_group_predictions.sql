-- ============================================================
-- Group Predictions (separate tips for group scoring)
-- Migration: 0007_group_predictions
-- ============================================================

CREATE TABLE IF NOT EXISTS group_predictions (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   TEXT NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  match_id   TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL CHECK (home_score >= 0),
  away_score INTEGER NOT NULL CHECK (away_score >= 0),
  points     INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, group_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_gp_user_id  ON group_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_gp_group_id ON group_predictions(group_id);
CREATE INDEX IF NOT EXISTS idx_gp_match_id ON group_predictions(match_id);
