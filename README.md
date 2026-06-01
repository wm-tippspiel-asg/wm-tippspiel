# WM-Tippspiel 2026

Ein Tippspiel zur FIFA Weltmeisterschaft 2026 von dem Informatikkurs der 11. Klasse 2026.

---

## Inhaltsverzeichnis

1. [Einleitung](#einleitung)
2. [Was ist dieses Projekt?](#was-ist-dieses-projekt)
3. [Features](#features)
4. [Regeln & Punkteverteilung](#regeln--punkteverteilung)
5. [Technisches](#technisches)
   - [Projektstruktur](#projektstruktur)
   - [Tech Stack](#tech-stack)
   - [Wie funktioniert das Projekt?](#wie-funktioniert-das-projekt)
   - [Security](#security)
6. [KI-Dokumentation](#ki-dokumentation)
7. [Bugs & Report](#bugs--report)
8. [Lizenz](#lizenz)

---

## Einleitung

Dieses Projekt ist eine Idee des Informatikkurses der 11. Klasse 2026. Da die WM schon bald startet, hatten wir uns überlegt, dass es cool wäre, ein Tippspiel zu organisieren, bei dem die ganze Schule mitmachen kann. Darum haben wir diese Idee umgesetzt.

Bei der Erstellung dieses Projektes wurde die KI [Claude Code](https://code.claude.com/docs/de/overview) von Anthropic zur Hilfe genommen. Es ist beeindruckend, wie schnell KI so ein Projekt umsetzen kann, wenn man es richtig angeht, die richtigen Prompts formuliert und die richtige Arbeitsumgebung hat.

Ein großes Problem bei einem solchen Projekt war die **Token Usage**, auf die ich in der [KI-Dokumentation](#ki-dokumentation) genauer eingehen werde. Außerdem war uns das Sicherheitsvorgehen ein wichtiges Anliegen. Da KI viel `slop` generiert, wird die Sicherheit oft vernachlässigt. Es ist wichtig, ein bisschen Coding-Knowledge zu haben, um den Code nochmal auf häufige Fehler (siehe [OWASP Top 10](https://owasp.org/www-project-top-ten/)) zu durchschauen. Klar wird es immer noch Bugs und Fehler im Code geben, für mehr Infos dazu siehe [Bugs & Report](#bugs--report).

---

## Was ist dieses Projekt?

Eine webbasierte Tippspiel-Plattform für die FIFA WM 2026. Schülerinnen und Schüler können sich mit einem Zugangscode registrieren und für alle WM-Spiele ihre Ergebnisse tippen. Nach jedem Spiel werden die Punkte automatisch verteilt und die Rangliste aktualisiert.

**Live:** [wm-tippspiel-cz0.pages.dev](https://wm-tippspiel-cz0.pages.dev) // Ich weiß trash domain aber hoffentlich bald eine bessere.

---

## Features

| Bereich | Features |
|---------|----------|
| **Auth** | Registrierung mit Zugangscode, Login, sichere Sessions |
| **Dashboard** | Nächste Spiele, Countdown bis zum Spiel, Tipp-Abgabe |
| **Tipps** | Alle WM-Phasen, Bearbeiten bis Anpfiff |
| **Rangliste** | Live-Leaderboard, eigene Position hervorgehoben |
| **Profil** | Benutzername & Passwort ändern |
| **Admin** | Nutzer-, Spiel- & Codeverwaltung, Audit-Logs |
| **Design** | Dark/Light Mode, Mobile First |

---

## Regeln & Punkteverteilung

Jeder Teilnehmer kann für jedes Spiel einen Tipp abgeben. Tipps können bis zum **offiziellen Anpfiff** geändert werden, danach ist keine Änderung mehr möglich (serverseitig und clientseitig gesperrt).

### Punktesystem

| Ergebnis | Punkte |
|----------|:------:|
| Exaktes Ergebnis (z.B. 2:1 getippt, 2:1 erzielt) | **5** |
| Richtige Tordifferenz & richtiger Gewinner (z.B. 3:1 getippt, 2:0 erzielt) | **3** |
| Richtiger Gewinner oder Unentschieden | **2** |
| Falsch | **0** |

Bei Punktegleichstand entscheidet die Anzahl der exakten Treffer.

---

## Technisches

### Projektstruktur

```
src/
├── app/
│   ├── (auth)/          # Login, Registrierung
│   ├── (dashboard)/     # Nutzerbereich
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
│   └── api/             # REST API Routes (Edge Runtime)
├── components/
│   ├── ui/              # Button, Input, Card, Modal, …
│   ├── layout/          # Navbar
│   ├── dashboard/       # MatchCard, PredictionForm, …
│   └── admin/           # Admin-spezifische Komponenten
├── lib/
│   ├── auth.ts          # Session-Management
│   ├── crypto.ts        # PBKDF2, HMAC (Web Crypto API)
│   ├── db.ts            # D1 Query-Helpers
│   ├── scoring.ts       # Punkteberechnung + Leaderboard
│   ├── rateLimit.ts     # KV-basiertes Rate-Limiting
│   ├── audit.ts         # Audit-Logging
│   ├── validation.ts    # Zod-Schemas
│   └── utils.ts         # Hilfsfunktionen
├── middleware.ts         # Route-Schutz (Auth + Admin)
└── types/index.ts        # TypeScript-Typen
```

### Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | [Next.js 15](https://nextjs.org) (App Router, Edge Runtime) |
| Sprache | TypeScript (Strict Mode) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| Datenbank | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Cache / Rate-Limiting | [Cloudflare KV](https://developers.cloudflare.com/kv/) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) |
| CI/CD | GitHub -> Cloudflare Pages automatisch bei Push wird deployed (beste möglichkeit wie ich finde, geht super easy) |
| Validierung | [Zod](https://zod.dev) |

### Wie funktioniert das Projekt?

1. **Registrierung**: Schüler erhalten einen Zugangscode vom Admin und registrieren sich damit.
2. **Tipps abgeben**: Vor jedem Spiel können Ergebnisse getippt werden. Nach Anpfiff ist der Tipp gesperrt.
3. **Auswertung**: Nach Spielende trägt der Admin das Ergebnis ein. Punkte werden automatisch berechnet und die Rangliste aktualisiert.
4. **Rangliste**: Alle Teilnehmer sehen die aktuelle Rangliste in Echtzeit.

### Security

Da KI-generierter Code oft Sicherheitslücken enthält, wurde bei diesem Projekt besonders auf folgende Punkte geachtet:

| Bedrohung | Maßnahme |
|-----------|----------|
| Passwort-Angriffe | PBKDF2-SHA256 mit 100.000 Iterationen (Web Crypto API) |
| Session-Hijacking | HMAC-signierte Tokens, HttpOnly + Secure + SameSite=Strict Cookies |
| Brute-Force | Rate-Limiting: 10 Login-Versuche / 15 min (Cloudflare KV) |
| SQL Injection | Parametrisierte D1-Queries (kein String-Concatenation) |
| XSS | Content-Security-Policy Header, keine direkte HTML-Interpolation |
| CSRF | SameSite=Strict Cookies |
| IDOR | Alle DB-Queries filtern nach `user_id = ?` |
| Tipp-Manipulation | Serverseitige Zeitprüfung, API verweigert Änderungen nach Anpfiff |
| Clickjacking | `X-Frame-Options: DENY` Header |
| Privilege Escalation | Rollenprüfung in Middleware + jeder API-Route |

Alle sicherheitsrelevanten Aktionen werden in `audit_logs` protokolliert, die nur der Admin sehen kann.

> ⚠️ Trotz dieser Maßnahmen kann es noch Bugs oder Lücken geben. Für Meldungen siehe [Bugs & Report](#bugs--report).

---

## KI-Dokumentation

### Vorab

Die hier gezeigten Prompts sind die größten und wichtigsten Prompts dieses Projekts. Zwischen diesen Prompts wurden viele Fehler gefixt, Funktionen bearbeitet und die komplette Projektstruktur eingerichtet. Es ist deshalb nicht möglich bzw. zu viel Arbeit, alle Schritte und Prompts genau zu dokumentieren.

### Usage

[Claude Code](https://code.claude.com/docs/de/overview) ist ein bezahltes KI-Modell von Anthropic. Man hat nur eine bestimmte Anzahl von Tokens bzw. eine bestimmte Usage, die man nutzen kann. Mit diesem Projekt wurden bis jetzt insgesamt ca. **400.000 Tokens** verbraucht. Das entspricht beim Claude Max ×5-Plan einer Usage von ca. **40 % des Weekly Limits**. Zudem wurde noch Claude Design benutzt, welches für das Design verantwortlich war. Claude Design ist ebenfalls nur im Paid Plan enthalten.

---

### Prompt 1 Grundprojekt

**Intention:** Eine gute Grundbasis für das Projekt schaffen und danach einzelne Verbesserungen vornehmen.

Wichtig bei diesem Prompt war, der KI möglichst genaue Anweisungen zu geben und unsere Vorstellungen klar zu beschreiben. Dazu gehörten sowohl die gewünschte Projektstruktur als auch die geplante Deployment-Umgebung.

In unserem Fall waren die wichtigsten Vorgaben:

- Cloudflare Pages fürs Hosten
- Cloudflare D1 als Datenbank
- GitHub zum Verwalten und Pushen des Codes
- Next.js für das Frontend
- TypeScript als Programmiersprache
- Tailwind CSS für das Design

<details>
<summary>Prompt anzeigen</summary>

```
# Projektziel

Eine moderne, professionelle und benutzerfreundliche WM-Tippspiel-Plattform für Schülerinnen und Schüler.

Die Anwendung wird auf Cloudflare Pages gehostet und soll dafür ausgelegt sein.

# Design-Anforderungen

- Modernes, professionelles Design
- Dark Mode und Light Mode
- Manuell gestaltetes UI
- KEIN generischer KI-Stil
- Klare Hierarchie
- Sehr gute Lesbarkeit
- Mobile First
- Responsive auf Desktop, Tablet und Smartphone
- Fokus auf Benutzerfreundlichkeit
- Schnelle Ladezeiten
- Barrierearme Gestaltung

Design-Inspiration:
- GitHub
- Linear
- Notion
- Stripe Dashboard

Keine übertriebenen Animationen.
Keine verspielten Effekte.
Alles soll seriös, sauber und schulgeeignet wirken.

# Technischer Stack

Bevorzugt:
- Next.js
- TypeScript
- TailwindCSS
- Cloudflare Pages
- Cloudflare D1 (Datenbank)
- Cloudflare KV falls sinnvoll
- Cloudflare Workers

[... vollständiger Prompt mit allen Anforderungen zu Rollen, Dashboard, Punktesystem, Sicherheit und Datenbankdesign ...]
```

</details>

**Ergebnis:** Vollständiges Next.js-Projekt mit 70+ Dateien, komplettem Datenbankschema, Auth-System, Admin-Panel, Dashboard und Sicherheitsmaßnahmen.

---

### Prompt 2 Design-Überarbeitung & WM-Spielplan

**Intention:** WM 2026 Spiele automatisch eintragen, Übersichtlichkeit erhöhen.

```
Verbessere die Übersichtlichkeit. Außerdem zeige die Spiele der WM 2026 automatisch an.
```

**Ergebnis:**
- Komplett neues Design (Grün statt Lila, größere Schrift, cleaner Sports-Look)
- Alle 72 WM 2026 Gruppenspiele automatisch in die Datenbank eingetragen
- Größere Karten mit Flaggen-Emojis und besserer Struktur
- Verbesserte Navbar und Navigation

---

## Bugs & Report

Falls du einen Bug oder eine Sicherheitslücke findest, melde sie bitte hier oder sprich uns direkt in der Schule an.
Besonders wenn du einen Fehler findest, der dir einen unfairen Vorteil verschafft oder das Tippspiel beeinflussen kann, würden wir uns über eine Meldung freuen.
Es gibt zwar keine Belohnung dafür, aber das Projekt wurde für die Schule entwickelt und soll allen Beteiligten Spaß machen und fair bleiben.
Wir wissen, dass es lusting oder verlockend sein kann, solche Fehler auszunutzen, aber bitte sei nicht komisch und melde sie stattdessen.

- **GitHub Issues:** [github.com/wm-tippspiel-asg/wm-tippspiel/issues](https://github.com/wm-tippspiel-asg/wm-tippspiel/issues)

Bitte beim Melden folgende Informationen angeben:
- Kurze Beschreibung des Problems
- Erwartetes vs. tatsächliches Verhalten
- Screenshots (falls hilfreich)

> Für sicherheitsrelevante Lücken bitte **kein öffentliches Issue** erstellen, stattdessen direkt per E-Mail auf IServ oder direkt in der Schule ansprechen.

---

## Lizenz

Dieses Projekt steht unter der [MIT License](LICENSE).

Erstellt vom Informatikkurs der Klasse 11, 2026.  
Unterstützt durch [Claude Code](https://code.claude.com) von Anthropic.
