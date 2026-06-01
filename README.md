# 🏆 WM-Tippspiel

Modernes, sicheres WM-Tippspiel für Schulen — gebaut mit Next.js 15 und Cloudflare Pages.

## Features

| Bereich | Funktionen |
|---------|-----------|
| **Authentifizierung** | Registrierung mit Zugangscode, Login, sichere Sessions |
| **Tippabgabe** | Alle WM-Phasen, Echtzeit-Countdown, Sperrmechanismus |
| **Rangliste** | Live-Leaderboard, eigene Position hervorgehoben |
| **Admin-Panel** | Nutzer-, Spiel- und Codeverwaltung, Audit-Logs |
| **Sicherheit** | PBKDF2, HttpOnly Cookies, Rate Limiting, CSP |
| **Design** | Dark/Light Mode, Mobile First, GitHub/Linear-Stil |

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router, Edge Runtime)
- **Styling**: Tailwind CSS 3
- **Sprache**: TypeScript (Strict)
- **Datenbank**: Cloudflare D1 (SQLite)
- **Cache/Rate-Limit**: Cloudflare KV
- **Hosting**: Cloudflare Pages

## Schnellstart

```bash
npm install
cp .env.example .env.local
# SESSION_SECRET in .env.local eintragen

npm run dev
```

## Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Cloudflare-Deployment Schritt für Schritt |
| [DATABASE.md](docs/DATABASE.md) | Datenbankschema und Punktesystem |
| [SECURITY.md](docs/SECURITY.md) | Sicherheitskonzept und Maßnahmen |

## Projektstruktur

```
src/
├── app/
│   ├── (auth)/          # Login, Registrierung
│   ├── (dashboard)/     # Nutzer-Bereich
│   │   ├── dashboard/   # Startseite mit Tipps & Leaderboard
│   │   ├── predictions/ # Alle Tipps nach Runde
│   │   ├── leaderboard/ # Vollständige Rangliste
│   │   ├── profile/     # Profil & Passwort ändern
│   │   └── about/       # Regeln, Punktesystem
│   ├── admin/           # Admin-Panel
│   │   ├── users/       # Nutzerverwaltung
│   │   ├── matches/     # Spielverwaltung + Ergebnisse
│   │   ├── codes/       # Zugangscode-Generator
│   │   └── logs/        # Audit-Logs
│   └── api/             # REST API Routes
├── components/
│   ├── ui/              # Button, Input, Card, Modal, ...
│   ├── layout/          # Navbar
│   ├── dashboard/       # MatchCard, PredictionForm, ...
│   └── admin/           # Admin-spezifische Komponenten
├── lib/
│   ├── auth.ts          # Session-Management
│   ├── crypto.ts        # PBKDF2, HMAC (Web Crypto API)
│   ├── db.ts            # D1 Query-Helpers
│   ├── scoring.ts       # Punkteberechnung
│   ├── rateLimit.ts     # KV-basiertes Rate-Limiting
│   ├── audit.ts         # Audit-Logging
│   ├── validation.ts    # Zod-Schemas
│   └── utils.ts         # Hilfsfunktionen
├── middleware.ts         # Route-Schutz
└── types/index.ts        # TypeScript-Typen
```

## Punkte-System

| Ergebnis | Punkte |
|----------|--------|
| Exakt (z.B. 2:1 → 2:1) | **5** |
| Richtige Differenz + Gewinner | **3** |
| Richtiger Gewinner/Unentschieden | **2** |
| Falsch | 0 |

Konfigurierbar in der Datenbank (`scoring_config`).

## Lizenz

Nur für den internen Schulgebrauch bestimmt.
