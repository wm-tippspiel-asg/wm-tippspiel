# Sicherheitskonzept

## Authentifizierung

| Maßnahme | Implementierung |
|----------|----------------|
| Passwort-Hashing | PBKDF2-SHA256, 100.000 Iterationen (Web Crypto API) |
| Session-Token | 32-Byte zufälliger Token, HMAC-SHA256 signiert |
| Session-Speicherung | D1-Datenbank mit Token-Hash (nicht Klartext) |
| Cookies | `HttpOnly`, `Secure`, `SameSite=Strict` |
| Session-Ablauf | 7 Tage (konfigurierbar) |
| Rate Limiting | Login: 10/15min · Registrierung: 5/Stunde (Cloudflare KV) |

## Autorisierung

| Maßnahme | Implementierung |
|----------|----------------|
| Rollenprüfung | Middleware + jede API-Route prüft Header `x-user-role` |
| Admin-Isolation | Separate Routen, vollständige Rollenprüfung |
| IDOR-Schutz | Alle Queries filtern nach `user_id = ?` |
| PrivEsc-Schutz | `role` kann nicht über Nutzer-API geändert werden |

## Eingabe-Validierung

- Zod-Schemas für alle API-Eingaben (serverseitig)
- String-Sanitisierung: `<` und `>` werden entfernt
- Parametrisierte Queries (D1 `bind()`) — kein String-Concatenation

## Tippschutz

Doppelte Absicherung gegen nachträgliche Tipp-Änderungen:

1. **Clientseitig**: Formular deaktiviert nach Spielbeginn (Countdown)
2. **Serverseitig**: API prüft `match_time <= NOW()` und `status IN ('locked', 'finished')`

→ Clientseitige Prüfung ist nur UX, **nicht** sicherheitsrelevant.

## Sicherheits-Header

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; ...
```

## Schutz gegen bekannte Angriffsvektoren

| Angriff | Schutz |
|---------|--------|
| SQL Injection | Parametrisierte D1-Queries |
| XSS | CSP-Header, keine direkte HTML-Interpolation |
| CSRF | SameSite=Strict Cookies |
| Session Fixation | Neue Session-ID bei Login |
| Timing-Attacks | Constant-time String-Vergleich, simulierter Hash-Check |
| Clickjacking | X-Frame-Options: DENY |
| Open Redirect | Keine externen Redirect-Targets |
| Brute-Force | Rate Limiting auf Login-Endpunkt |

## Audit-Logging

Protokollierte Ereignisse:
- Anmeldungen (erfolgreich/fehlgeschlagen)
- Registrierungen
- Nutzer gesperrt/entsperrt/gelöscht
- Spielstände eingetragen
- Zugangscodes erstellt/gelöscht
- Passwort-Änderungen
- Leaderboard neu berechnet

## Empfehlungen für Produktion

1. `SESSION_SECRET` rotieren nach einem Sicherheitsvorfall
2. Audit-Logs regelmäßig prüfen
3. Cloudflare WAF aktivieren (kostenlos im Pro-Plan)
4. Zugangscodes mit Ablaufdatum verwenden
