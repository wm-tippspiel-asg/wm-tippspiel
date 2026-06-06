#!/usr/bin/env node
/**
 * Importiert Schüler aus einer Excel-Datei (.xls/.xlsx) in die D1-Datenbank.
 *
 * Erwartete Spalten (Name oder Position):
 *   Code | Benutzername | Klasse
 *
 * Verwendung:
 *   node scripts/import-users.mjs --file schueler.xls [--db wm-tippspiel-db] [--remote] [--dry-run]
 *
 * Flags:
 *   --file     Pfad zur Excel-Datei (Pflicht)
 *   --db       Name der D1-Datenbank (Standard: wm-tippspiel-db)
 *   --remote   Gegen die Cloudflare-Produktionsdatenbank ausführen
 *   --dry-run  Nur SQL anzeigen, nichts ausführen
 *
 * Voraussetzungen:
 *   npm install xlsx   (einmalig)
 *   wrangler muss installiert und angemeldet sein
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { execSync } from 'child_process'
import { randomBytes, pbkdf2 } from 'crypto'
import { promisify } from 'util'

const pbkdf2Async = promisify(pbkdf2)

// ── Args ────────────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(flag) {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : null
}

const filePath = getArg('--file')
const dbName   = getArg('--db') ?? 'wm-tippspiel-db'
const isRemote = args.includes('--remote')
const isDryRun = args.includes('--dry-run')

if (!filePath) {
  console.error('Fehler: --file ist Pflicht.')
  console.error('Verwendung: node scripts/import-users.mjs --file schueler.xls [--db wm-tippspiel-db] [--remote] [--dry-run]')
  process.exit(1)
}

// ── Helpers ─────────────────────────────────────────────────
function newId() {
  return randomBytes(16).toString('hex')
}

async function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = await pbkdf2Async(String(password), salt, 100_000, 32, 'sha256')
  return `pbkdf2:100000:${salt.toString('hex')}:${hash.toString('hex')}`
}

function sql(val) {
  return String(val ?? '').replace(/'/g, "''")
}

// ── Parse Excel ─────────────────────────────────────────────
async function main() {
  console.log('\n WM-Tippspiel — Schüler-Import\n')

  let xlsx
  try {
    xlsx = await import('xlsx')
  } catch {
    console.error('Paket "xlsx" fehlt. Bitte installieren:')
    console.error('  npm install xlsx')
    process.exit(1)
  }

  const workbook = xlsx.read(readFileSync(filePath))
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (rows.length < 2) {
    console.error('Datei ist leer oder enthält keine Datenzeilen.')
    process.exit(1)
  }

  // Column detection by header name (case-insensitive)
  const header = rows[0].map(h => String(h).trim().toLowerCase())

  const codeNames    = ['code', 'passwort', 'password', 'pw', 'kennwort', 'pin']
  const nameNames    = ['benutzername', 'username', 'name', 'nutzer', 'login']
  const klasseNames  = ['klasse', 'gruppe', 'kurs', 'class', 'group', 'abteilung']

  const cIdx = header.findIndex(h => codeNames.includes(h))   >= 0
    ? header.findIndex(h => codeNames.includes(h))   : 0
  const nIdx = header.findIndex(h => nameNames.includes(h))   >= 0
    ? header.findIndex(h => nameNames.includes(h))   : 1
  const kIdx = header.findIndex(h => klasseNames.includes(h)) >= 0
    ? header.findIndex(h => klasseNames.includes(h)) : 2

  console.log(`Spalten erkannt:`)
  console.log(`  Code       → Spalte "${header[cIdx] || cIdx + 1}"`)
  console.log(`  Benutzername → Spalte "${header[nIdx] || nIdx + 1}"`)
  console.log(`  Klasse     → Spalte "${header[kIdx] || kIdx + 1}"`)
  console.log()

  // Parse data rows (skip header)
  const users = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const code     = String(row[cIdx] ?? '').trim()
    const username = String(row[nIdx] ?? '').trim()
    const klasse   = String(row[kIdx] ?? '').trim()
    if (!code || !username) continue
    users.push({ code, username, klasse })
  }

  if (users.length === 0) {
    console.error('Keine Nutzer in der Datei gefunden (alle Zeilen leer?).')
    process.exit(1)
  }

  const klassen = [...new Set(users.map(u => u.klasse).filter(Boolean))]
  console.log(`${users.length} Nutzer gefunden in ${klassen.length} Klasse(n): ${klassen.join(', ')}`)
  console.log()

  // Hash passwords
  console.log('Passwörter werden gehasht (das dauert einen Moment)...')
  const prepared = []
  for (let i = 0; i < users.length; i++) {
    const u = users[i]
    process.stdout.write(`\r  ${i + 1}/${users.length} — ${u.username}   `)
    const hash = await hashPassword(u.code)
    prepared.push({ ...u, id: newId(), hash })
  }
  console.log('\r  Fertig!                              \n')

  // ── Generate SQL ────────────────────────────────────────
  const lines = []
  lines.push('-- WM-Tippspiel Schüler-Import')
  lines.push(`-- Generiert: ${new Date().toISOString()}`)
  lines.push(`-- Nutzer: ${prepared.length} | Klassen: ${klassen.length}`)
  lines.push('')

  // 1. Gruppen anlegen
  lines.push('-- Klassen/Gruppen')
  for (const klasse of klassen) {
    lines.push(`INSERT OR IGNORE INTO user_groups (id, name) VALUES ('${newId()}', '${sql(klasse)}');`)
  }
  lines.push('')

  // 2. Nutzer anlegen + Rangliste
  lines.push('-- Nutzer')
  for (const u of prepared) {
    lines.push(`INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES ('${u.id}', '${sql(u.username)}', '${u.hash}', 'user');`)
    // Rangliste-Eintrag: benutze die tatsächliche users.id (NOT OR REPLACE, um bestehende nicht zu überschreiben)
    lines.push(`INSERT OR IGNORE INTO leaderboard (user_id, username) SELECT id, username FROM users WHERE username = '${sql(u.username)}' COLLATE NOCASE LIMIT 1;`)
  }
  lines.push('')

  // 3. Gruppenmitgliedschaften
  lines.push('-- Klassenzuordnungen')
  for (const u of prepared) {
    if (!u.klasse) continue
    lines.push(
      `INSERT OR IGNORE INTO user_group_members (user_id, group_id) ` +
      `SELECT u.id, ug.id FROM users u, user_groups ug ` +
      `WHERE u.username = '${sql(u.username)}' COLLATE NOCASE AND ug.name = '${sql(u.klasse)}' LIMIT 1;`
    )
  }

  const sqlText = lines.join('\n')

  // ── Dry Run ─────────────────────────────────────────────
  if (isDryRun) {
    console.log('=== DRY RUN — SQL (wird NICHT ausgeführt) ===\n')
    console.log(sqlText)
    return
  }

  // ── Execute ─────────────────────────────────────────────
  const tmpFile = `import-${Date.now()}.sql`
  writeFileSync(tmpFile, sqlText, 'utf8')

  const remote = isRemote ? '--remote' : '--local'
  const cmd = `wrangler d1 execute ${dbName} ${remote} --file=${tmpFile}`

  console.log(`Schreibe in D1 (${isRemote ? 'REMOTE — Produktion' : 'lokal'})...`)
  try {
    execSync(cmd, { stdio: 'inherit' })
    console.log(`\n Import erfolgreich!`)
    console.log(`   ${prepared.length} Nutzer angelegt`)
    console.log(`   ${klassen.length} Klassen angelegt`)
    console.log()
    console.log('Schüler können sich jetzt mit ihrem Benutzernamen und dem Code als Passwort einloggen.')
    console.log()
  } catch (err) {
    console.error('\n Import fehlgeschlagen:', err.message)
    process.exit(1)
  } finally {
    try { unlinkSync(tmpFile) } catch {}
  }
}

main().catch(err => {
  console.error('Unerwarteter Fehler:', err)
  process.exit(1)
})
