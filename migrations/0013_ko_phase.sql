-- Migration 0013: KO-Phase WM 2026
-- Adds third_place round type (requires table recreation in SQLite)
-- Inserts all 32 KO phase placeholder matches

PRAGMA foreign_keys = OFF;

CREATE TABLE matches_new (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  home_team     TEXT NOT NULL,
  away_team     TEXT NOT NULL,
  home_team_flag TEXT,
  away_team_flag TEXT,
  match_time    TEXT NOT NULL,
  round         TEXT NOT NULL CHECK (round IN (
    'group', 'round_of_16', 'round_of_8', 'quarter_final', 'semi_final', 'third_place', 'final'
  )),
  group_name    TEXT,
  venue         TEXT,
  home_score    INTEGER,
  away_score    INTEGER,
  status        TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'live', 'finished', 'cancelled', 'locked'
  )),
  locked_at     TEXT,
  score_locked  INTEGER NOT NULL DEFAULT 0 CHECK (score_locked IN (0, 1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO matches_new
  SELECT id, home_team, away_team, home_team_flag, away_team_flag,
         match_time, round, group_name, venue, home_score, away_score,
         status, locked_at, score_locked, created_at, updated_at
  FROM matches;

DROP TABLE matches;
ALTER TABLE matches_new RENAME TO matches;

CREATE INDEX IF NOT EXISTS idx_matches_match_time ON matches(match_time);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);

PRAGMA foreign_keys = ON;

-- ============================================================
-- Sechzehntelfinale (Round of 32) — 16 Spiele, 1.–8. Juli
-- Teams werden vom Admin befüllt, sobald Gruppen feststehen
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('Sieger Gr. A',    'Bester Dritter',    NULL, NULL, '2026-07-01T18:00:00Z', 'round_of_16', 'MetLife Stadium, New York',              'locked'),
('2. Gr. C',        '2. Gr. D',          NULL, NULL, '2026-07-01T22:00:00Z', 'round_of_16', 'AT&T Stadium, Arlington',                'locked'),
('Sieger Gr. B',    'Bester Dritter',    NULL, NULL, '2026-07-02T18:00:00Z', 'round_of_16', 'SoFi Stadium, Los Angeles',              'locked'),
('Sieger Gr. C',    '2. Gr. A',          NULL, NULL, '2026-07-02T22:00:00Z', 'round_of_16', 'Hard Rock Stadium, Miami',               'locked'),
('Sieger Gr. D',    '2. Gr. E',          NULL, NULL, '2026-07-03T18:00:00Z', 'round_of_16', 'Lumen Field, Seattle',                   'locked'),
('Sieger Gr. E',    '2. Gr. F',          NULL, NULL, '2026-07-03T22:00:00Z', 'round_of_16', 'NRG Stadium, Houston',                   'locked'),
('Sieger Gr. F',    '2. Gr. G',          NULL, NULL, '2026-07-04T18:00:00Z', 'round_of_16', 'Mercedes-Benz Stadium, Atlanta',         'locked'),
('Sieger Gr. G',    '2. Gr. H',          NULL, NULL, '2026-07-04T22:00:00Z', 'round_of_16', 'BC Place, Vancouver',                    'locked'),
('Sieger Gr. H',    '2. Gr. I',          NULL, NULL, '2026-07-05T18:00:00Z', 'round_of_16', 'Lincoln Financial Field, Philadelphia',  'locked'),
('Sieger Gr. I',    'Bester Dritter',    NULL, NULL, '2026-07-05T22:00:00Z', 'round_of_16', 'BMO Field, Toronto',                     'locked'),
('Sieger Gr. J',    '2. Gr. K',          NULL, NULL, '2026-07-06T18:00:00Z', 'round_of_16', 'Estadio Azteca, Mexiko-Stadt',           'locked'),
('Sieger Gr. K',    '2. Gr. L',          NULL, NULL, '2026-07-06T22:00:00Z', 'round_of_16', 'Estadio BBVA, Monterrey',                'locked'),
('Sieger Gr. L',    'Bester Dritter',    NULL, NULL, '2026-07-07T18:00:00Z', 'round_of_16', 'Gillette Stadium, Boston',               'locked'),
('2. Gr. B',        '2. Gr. J',          NULL, NULL, '2026-07-07T22:00:00Z', 'round_of_16', 'Arrowhead Stadium, Kansas City',         'locked'),
('Bester Dritter',  '2. Gr. K',          NULL, NULL, '2026-07-08T18:00:00Z', 'round_of_16', 'Levi''s Stadium, Santa Clara',           'locked'),
('Bester Dritter',  '2. Gr. L',          NULL, NULL, '2026-07-08T22:00:00Z', 'round_of_16', 'Estadio Akron, Guadalajara',             'locked');

-- ============================================================
-- Achtelfinale (Round of 16) — 8 Spiele, 10.–14. Juli
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('TBD', 'TBD', NULL, NULL, '2026-07-10T18:00:00Z', 'round_of_8', 'MetLife Stadium, New York',              'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-10T22:00:00Z', 'round_of_8', 'AT&T Stadium, Arlington',                'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-11T18:00:00Z', 'round_of_8', 'SoFi Stadium, Los Angeles',              'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-11T22:00:00Z', 'round_of_8', 'Hard Rock Stadium, Miami',               'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-12T18:00:00Z', 'round_of_8', 'Mercedes-Benz Stadium, Atlanta',         'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-12T22:00:00Z', 'round_of_8', 'BC Place, Vancouver',                    'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-13T18:00:00Z', 'round_of_8', 'Lumen Field, Seattle',                   'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-13T22:00:00Z', 'round_of_8', 'NRG Stadium, Houston',                   'locked');

-- ============================================================
-- Viertelfinale (Quarterfinals) — 4 Spiele, 17.–18. Juli
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('TBD', 'TBD', NULL, NULL, '2026-07-17T18:00:00Z', 'quarter_final', 'MetLife Stadium, New York',   'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-17T22:00:00Z', 'quarter_final', 'AT&T Stadium, Arlington',     'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-18T18:00:00Z', 'quarter_final', 'SoFi Stadium, Los Angeles',   'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-18T22:00:00Z', 'quarter_final', 'Hard Rock Stadium, Miami',    'locked');

-- ============================================================
-- Halbfinale (Semifinals) — 2 Spiele, 21.–22. Juli
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('TBD', 'TBD', NULL, NULL, '2026-07-21T22:00:00Z', 'semi_final', 'MetLife Stadium, New York',  'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-22T22:00:00Z', 'semi_final', 'AT&T Stadium, Arlington',    'locked');

-- ============================================================
-- Spiel um Platz 3 — 25. Juli
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('TBD', 'TBD', NULL, NULL, '2026-07-25T20:00:00Z', 'third_place', 'Hard Rock Stadium, Miami', 'locked');

-- ============================================================
-- Finale — 26. Juli, MetLife Stadium New York
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('TBD', 'TBD', NULL, NULL, '2026-07-26T20:00:00Z', 'final', 'MetLife Stadium, New York', 'locked');
