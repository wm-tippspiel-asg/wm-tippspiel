-- Update special bets scoring: 20 pts for winner, 15 pts for top scorer
UPDATE scoring_config SET value = 20 WHERE key = 'special_winner';
UPDATE scoring_config SET value = 15 WHERE key = 'special_top_scorer';
