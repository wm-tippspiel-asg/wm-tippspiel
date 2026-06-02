-- ============================================================
-- User Groups (Klassen, Kurse, Abteilungen, etc.)
-- Migration: 0006_user_groups
-- ============================================================

CREATE TABLE IF NOT EXISTS user_groups (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_group_members (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   TEXT NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  added_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  added_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_ugm_user_id  ON user_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ugm_group_id ON user_group_members(group_id);
