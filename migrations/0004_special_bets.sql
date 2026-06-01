CREATE TABLE IF NOT EXISTS special_bets (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_type   TEXT NOT NULL CHECK (bet_type IN ('winner', 'top_scorer')),
  prediction TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, bet_type)
);

CREATE INDEX IF NOT EXISTS idx_special_bets_user ON special_bets(user_id);
