#!/usr/bin/env node
/**
 * Creates the admin user in the D1 database.
 *
 * Usage:
 *   node scripts/create-admin.mjs --username admin --db wm-tippspiel-db
 *
 * Prerequisites:
 *   - wrangler installed and authenticated
 *   - D1 database already migrated (npm run db:migrate)
 *   - Provide password via ADMIN_PASSWORD env var or interactive prompt
 *
 * This script runs locally and calls wrangler to execute SQL against D1.
 */

import { createInterface } from 'readline'
import { execSync } from 'child_process'
import { randomBytes, pbkdf2 } from 'crypto'

const args = process.argv.slice(2)
const usernameIdx = args.indexOf('--username')
const dbIdx = args.indexOf('--db')
const username = usernameIdx >= 0 ? args[usernameIdx + 1] : 'admin'
const dbName = dbIdx >= 0 ? args[dbIdx + 1] : 'wm-tippspiel-db'
const isRemote = args.includes('--remote')

async function getPassword() {
  const envPw = process.env.ADMIN_PASSWORD
  if (envPw) return envPw

  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question('Admin password (min 8 chars): ', (pw) => {
      rl.close()
      resolve(pw)
    })
  })
}

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16)
    pbkdf2(password, salt, 100_000, 32, 'sha256', (err, hash) => {
      if (err) return reject(err)
      const saltHex = salt.toString('hex')
      const hashHex = hash.toString('hex')
      resolve(`pbkdf2:100000:${saltHex}:${hashHex}`)
    })
  })
}

async function main() {
  console.log(`\n🏆 WM-Tippspiel — Admin Setup\n`)
  console.log(`Username: ${username}`)
  console.log(`Database: ${dbName}`)
  console.log(`Remote:   ${isRemote}\n`)

  const password = await getPassword()
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  console.log('Hashing password...')
  const hash = await hashPassword(password)

  const userId = randomBytes(16).toString('hex')
  const sql = `
    INSERT OR REPLACE INTO users (id, username, password_hash, role)
    VALUES ('${userId}', '${username}', '${hash}', 'admin');
    INSERT OR IGNORE INTO leaderboard (user_id, username) VALUES ('${userId}', '${username}');
  `

  const remote = isRemote ? '--remote' : '--local'
  const cmd = `wrangler d1 execute ${dbName} ${remote} --command "${sql.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`

  console.log('Creating admin user...')
  try {
    execSync(cmd, { stdio: 'inherit' })
    console.log(`\n✅ Admin user "${username}" created successfully!`)
    console.log('   You can now log in at /login\n')
  } catch (err) {
    console.error('\n❌ Failed to create admin user:', err.message)
    process.exit(1)
  }
}

main()
