# Datenbankschema

## Übersicht (Cloudflare D1 / SQLite)

```
users ──────────────────────────────────────────────────────────────
  id            TEXT PK (UUID hex)
  username      TEXT UNIQUE NOCASE
  email         TEXT UNIQUE NOCASE (optional)
  password_hash TEXT (pbkdf2:iter:salt:hash)
  role          TEXT CHECK('admin','user')
  is_banned     INTEGER (0/1)
  ban_reason    TEXT
  created_at    TEXT (ISO 8601)
  updated_at    TEXT
  last_login    TEXT

sessions ────────────────────────────────────────────────────────────
  id            TEXT PK
  user_id       TEXT FK → users.id (CASCADE DELETE)
  token_hash    TEXT UNIQUE (SHA-256 des rohen Tokens)
  expires_at    TEXT
  created_at    TEXT
  ip_address    TEXT
  user_agent    TEXT

registration_codes ──────────────────────────────────────────────────
  id            TEXT PK
  code          TEXT UNIQUE
  description   TEXT
  max_uses      INTEGER (NULL = unbegrenzt)
  uses_count    INTEGER DEFAULT 0
  expires_at    TEXT (NULL = kein Ablauf)
  is_active     INTEGER (0/1)
  created_by    TEXT FK → users.id
  created_at    TEXT

code_uses ────────────────────────────────────────────────────────────
  id            TEXT PK
  code_id       TEXT FK → registration_codes.id
  user_id       TEXT FK → users.id
  used_at       TEXT
  UNIQUE(code_id, user_id)

matches ─────────────────────────────────────────────────────────────
  id            TEXT PK
  home_team     TEXT
  away_team     TEXT
  home_team_flag TEXT (Emoji)
  away_team_flag TEXT (Emoji)
  match_time    TEXT (ISO 8601)
  round         TEXT CHECK('group','round_of_16','round_of_8',
                            'quarter_final','semi_final','final')
  group_name    TEXT (A-H, für Gruppenphase)
  venue         TEXT
  home_score    INTEGER (NULL = noch nicht gespielt)
  away_score    INTEGER
  status        TEXT CHECK('scheduled','live','finished',
                            'cancelled','locked')
  locked_at     TEXT
  created_at    TEXT
  updated_at    TEXT

predictions ─────────────────────────────────────────────────────────
  id            TEXT PK
  user_id       TEXT FK → users.id (CASCADE DELETE)
  match_id      TEXT FK → matches.id (CASCADE DELETE)
  home_score    INTEGER ≥ 0
  away_score    INTEGER ≥ 0
  points        INTEGER (NULL = nicht berechnet)
  created_at    TEXT
  updated_at    TEXT
  UNIQUE(user_id, match_id)

leaderboard ─────────────────────────────────────────────────────────
  user_id       TEXT PK FK → users.id (CASCADE DELETE)
  username      TEXT
  total_points  INTEGER DEFAULT 0
  exact_results INTEGER DEFAULT 0
  correct_diff  INTEGER DEFAULT 0
  correct_winner INTEGER DEFAULT 0
  total_tips    INTEGER DEFAULT 0
  rank          INTEGER
  updated_at    TEXT

audit_logs ──────────────────────────────────────────────────────────
  id            TEXT PK
  actor_id      TEXT FK → users.id (SET NULL on delete)
  actor_name    TEXT
  action        TEXT
  target_type   TEXT
  target_id     TEXT
  details       TEXT (JSON)
  ip_address    TEXT
  created_at    TEXT

scoring_config ──────────────────────────────────────────────────────
  key           TEXT PK
  value         INTEGER
  label         TEXT
```

## Punktesystem-Konfiguration

Werte werden in `scoring_config` gespeichert:

| Key                       | Default | Bedeutung              |
|--------------------------|---------|------------------------|
| `exact_result`           | 5       | Exaktes Ergebnis       |
| `correct_diff_and_winner`| 3       | Differenz + Gewinner   |
| `correct_winner`         | 2       | Nur Gewinner/Unent.    |

Änderung via SQL:
```sql
UPDATE scoring_config SET value = 4 WHERE key = 'exact_result';
```

Nach Änderung Leaderboard neu berechnen: Admin-Panel → "Neu berechnen"

## Indexe

Alle wichtigen Lookup-Felder haben Indexe:
- `users(username)`, `users(role)`
- `sessions(token_hash)`, `sessions(user_id)`, `sessions(expires_at)`
- `registration_codes(code)`, `registration_codes(is_active)`
- `matches(match_time)`, `matches(status)`, `matches(round)`
- `predictions(user_id)`, `predictions(match_id)`
- `leaderboard(total_points DESC)`
- `audit_logs(actor_id)`, `audit_logs(action)`, `audit_logs(created_at DESC)`
