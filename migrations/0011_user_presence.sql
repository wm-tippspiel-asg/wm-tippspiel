CREATE TABLE IF NOT EXISTS user_presence (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  session_start TEXT NOT NULL DEFAULT (datetime('now')),
  total_seconds INTEGER NOT NULL DEFAULT 0
);
