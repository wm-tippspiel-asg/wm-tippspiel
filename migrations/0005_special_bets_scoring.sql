INSERT OR IGNORE INTO scoring_config (key, value, label) VALUES
  ('special_winner', 10, 'Sondertipp: Turniersieger'),
  ('special_top_scorer', 7, 'Sondertipp: Torschützenkönig');

CREATE TABLE IF NOT EXISTS special_bets_results (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  bet_type    TEXT NOT NULL UNIQUE CHECK (bet_type IN ('winner', 'top_scorer')),
  result      TEXT NOT NULL,
  resolved_at TEXT NOT NULL DEFAULT (datetime('now'))
);
