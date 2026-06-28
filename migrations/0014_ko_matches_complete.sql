-- Migration 0014: Schema-Update (third_place) + fehlende KO-Spiele

PRAGMA foreign_keys = OFF;

-- Tabelle neu erstellen mit third_place im CHECK
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
CREATE INDEX IF NOT EXISTS idx_matches_status     ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_round      ON matches(round);

PRAGMA foreign_keys = ON;

-- ============================================================
-- Fehlende 9 Sechzehntelfinale-Spiele (status: scheduled)
-- Zeiten: CEST (UTC+2) → UTC (−2h)
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, status) VALUES
-- 01.7. 01:00 CEST = 30.6. 23:00 UTC
('Portugal',           'Kroatien',            '🇵🇹', '🇭🇷', '2026-06-30T23:00:00Z', 'round_of_16', 'scheduled'),
-- 01.7. 18:00 CEST = 16:00 UTC
('England',            'DR Kongo',            '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇨🇩', '2026-07-01T16:00:00Z', 'round_of_16', 'scheduled'),
-- 01.7. 22:00 CEST = 20:00 UTC
('Belgien',            'Sénégal',             '🇧🇪', '🇸🇳', '2026-07-01T20:00:00Z', 'round_of_16', 'scheduled'),
-- 02.7. 02:00 CEST = 00:00 UTC
('USA',                'Bosnien-Herzegowina', '🇺🇸', '🇧🇦', '2026-07-02T00:00:00Z', 'round_of_16', 'scheduled'),
-- 02.7. 21:00 CEST = 19:00 UTC
('Spanien',            'Österreich',          '🇪🇸', '🇦🇹', '2026-07-02T19:00:00Z', 'round_of_16', 'scheduled'),
-- 03.7. 05:00 CEST = 03:00 UTC
('Schweiz',            'Algerien',            '🇨🇭', '🇩🇿', '2026-07-03T03:00:00Z', 'round_of_16', 'scheduled'),
-- 03.7. 20:00 CEST = 18:00 UTC
('Australien',         'Ägypten',             '🇦🇺', '🇪🇬', '2026-07-03T18:00:00Z', 'round_of_16', 'scheduled'),
-- 04.7. 00:00 CEST = 03.7. 22:00 UTC
('Argentinien',        'Kapverdische Inseln', '🇦🇷', '🇨🇻', '2026-07-03T22:00:00Z', 'round_of_16', 'scheduled'),
-- 04.7. 03:30 CEST = 01:30 UTC
('Kolumbien',          'Ghana',               '🇨🇴', '🇬🇭', '2026-07-04T01:30:00Z', 'round_of_16', 'scheduled');

-- ============================================================
-- Achtelfinale (round_of_8) — 8 Spiele, 10.–13. Juli
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('TBD', 'TBD', NULL, NULL, '2026-07-10T18:00:00Z', 'round_of_8', 'MetLife Stadium, New York',       'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-10T22:00:00Z', 'round_of_8', 'AT&T Stadium, Arlington',         'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-11T18:00:00Z', 'round_of_8', 'SoFi Stadium, Los Angeles',       'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-11T22:00:00Z', 'round_of_8', 'Hard Rock Stadium, Miami',        'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-12T18:00:00Z', 'round_of_8', 'Mercedes-Benz Stadium, Atlanta',  'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-12T22:00:00Z', 'round_of_8', 'BC Place, Vancouver',             'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-13T18:00:00Z', 'round_of_8', 'Lumen Field, Seattle',            'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-13T22:00:00Z', 'round_of_8', 'NRG Stadium, Houston',            'locked');

-- ============================================================
-- Viertelfinale (quarter_final) — 4 Spiele, 17.–18. Juli
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('TBD', 'TBD', NULL, NULL, '2026-07-17T18:00:00Z', 'quarter_final', 'MetLife Stadium, New York', 'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-17T22:00:00Z', 'quarter_final', 'AT&T Stadium, Arlington',   'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-18T18:00:00Z', 'quarter_final', 'SoFi Stadium, Los Angeles', 'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-18T22:00:00Z', 'quarter_final', 'Hard Rock Stadium, Miami',  'locked');

-- ============================================================
-- Halbfinale (semi_final) — 2 Spiele, 21.–22. Juli
-- ============================================================
INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, venue, status) VALUES
('TBD', 'TBD', NULL, NULL, '2026-07-21T22:00:00Z', 'semi_final', 'MetLife Stadium, New York', 'locked'),
('TBD', 'TBD', NULL, NULL, '2026-07-22T22:00:00Z', 'semi_final', 'AT&T Stadium, Arlington',   'locked');

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
