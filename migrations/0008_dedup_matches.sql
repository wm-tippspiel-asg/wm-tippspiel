-- ============================================================
-- Remove duplicate matches (same home_team, away_team, match_time)
-- Keep the row with the smallest id (MIN), delete the rest.
-- Predictions on deleted matches are removed via ON DELETE CASCADE.
-- Migration: 0008_dedup_matches
-- ============================================================

DELETE FROM matches
WHERE id NOT IN (
  SELECT MIN(id)
  FROM matches
  GROUP BY home_team, away_team, match_time
);
