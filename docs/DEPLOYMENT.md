# Deployment-Anleitung — Cloudflare Pages

## Voraussetzungen

- Node.js ≥ 18.17
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare-Konto (kostenloser Plan reicht)

---

## 1. Projekt vorbereiten

```bash
git clone <dein-repo>
cd wm-tippspiel
npm install
```

---

## 2. Cloudflare authentifizieren

```bash
wrangler login
```

---

## 3. D1-Datenbank erstellen

```bash
wrangler d1 create wm-tippspiel-db
```

**Ausgabe speichern:**
```
✅ Successfully created DB 'wm-tippspiel-db'
  database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Die `database_id` in `wrangler.toml` eintragen.

---

## 4. KV-Namespace für Rate-Limiting erstellen

```bash
wrangler kv namespace create "RATE_LIMIT"
```

Die `id` in `wrangler.toml` eintragen.

---

## 5. wrangler.toml konfigurieren

```toml
name = "wm-tippspiel"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "wm-tippspiel-db"
database_id = "DEINE_DATABASE_ID"  # ← hier eintragen

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "DEINE_KV_ID"  # ← hier eintragen
```

---

## 6. Datenbank-Migration ausführen

**Lokal (Entwicklung):**
```bash
npm run db:migrate
```

**Produktion:**
```bash
npm run db:migrate:prod
```

---

## 7. Admin-Account erstellen

**Lokal:**
```bash
node scripts/create-admin.mjs --username admin --db wm-tippspiel-db
```

**Produktion:**
```bash
node scripts/create-admin.mjs --username admin --db wm-tippspiel-db --remote
```

---

## 8. Umgebungsvariablen in Cloudflare Dashboard setzen

Unter: Pages → dein Projekt → Settings → Environment variables

| Variable        | Wert                           |
|----------------|-------------------------------|
| `SESSION_SECRET` | 64-Zeichen Zufallsstring       |
| `NODE_ENV`       | `production`                   |

**SESSION_SECRET generieren:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 9. Deployment

```bash
# Build und deploy in einem Schritt
npm run deploy

# Oder manuell:
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name wm-tippspiel
```

---

## 10. Lokale Entwicklung

```bash
# .env.local erstellen
cp .env.example .env.local
# SESSION_SECRET eintragen

# Dev-Server starten
npm run dev

# Mit Cloudflare-Bindings (D1, KV):
npm run preview
```

---

## Produktions-Checkliste

- [ ] `SESSION_SECRET` gesetzt (min. 32 bytes zufällig)
- [ ] D1-Datenbank migriert
- [ ] KV-Namespace erstellt
- [ ] Admin-Account angelegt
- [ ] `NODE_ENV=production` gesetzt
- [ ] Custom Domain konfiguriert (optional)
- [ ] HTTPS aktiv (automatisch bei CF Pages)
- [ ] Testregistrierung mit Code durchgeführt
- [ ] Admin-Panel erreichbar und funktionsfähig
- [ ] Tipp-Abgabe getestet
