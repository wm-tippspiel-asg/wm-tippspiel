import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDb, queryOne, queryAll } from '@/lib/db'
import { formatDate, formatDateTime } from '@/lib/utils'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Trophy, Target, Medal, Calendar, LogIn, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'Mein Profil' }

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const db = getDb()

  const [lb, groups] = await Promise.all([
    queryOne<{
      total_points: number
      exact_results: number
      correct_diff: number
      correct_winner: number
      total_tips: number
      rank: number | null
    }>(
      db,
      'SELECT total_points, exact_results, correct_diff, correct_winner, total_tips, rank FROM leaderboard WHERE user_id = ?',
      [user.id],
    ),
    queryAll<{ name: string }>(
      db,
      `SELECT ug.name FROM user_groups ug
       INNER JOIN user_group_members ugm ON ugm.group_id = ug.id
       WHERE ugm.user_id = ?
       ORDER BY ug.name ASC`,
      [user.id],
    ),
  ])

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <div style={{ maxWidth: 560 }} className="animate-fade-in space-y-6">
      <h1 className="page-title">Mein Profil</h1>

      {/* ── Avatar + Benutzername ── */}
      <div className="card" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="wm-avatar" style={{ width: 54, height: 54, fontSize: 20, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 19, color: 'var(--ink)', letterSpacing: '-.01em' }}>
            {user.username}
          </div>
          {groups.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <Users size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {groups.map((g) => g.name).join(' · ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <StatsCard
          label="Aktueller Rang"
          value={lb?.rank ? `#${lb.rank}` : '–'}
          icon={Trophy}
          highlight
        />
        <StatsCard
          label="Punkte gesamt"
          value={lb?.total_points ?? 0}
          icon={Medal}
        />
        <StatsCard
          label="Exakte Treffer"
          value={lb?.exact_results ?? 0}
          icon={Target}
          description="+5 Pkt. pro Treffer"
        />
        <StatsCard
          label="Tipps abgegeben"
          value={lb?.total_tips ?? 0}
          icon={Target}
        />
      </div>

      {/* ── Punkte-Aufschlüsselung ── */}
      {lb && (
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
              Punkte-Aufschlüsselung
            </span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {[
              { label: 'Exaktes Ergebnis', count: lb.exact_results, pkt: 5 },
              { label: 'Richtige Differenz + Gewinner', count: lb.correct_diff, pkt: 3 },
              { label: 'Richtiger Gewinner', count: lb.correct_winner, pkt: 2 },
            ].map(({ label, count, pkt }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px', gap: 12,
              }}>
                <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                    {count}× · +{pkt} Pkt.
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                    color: 'var(--ink)', width: 38, textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {count * pkt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Konto-Info ── */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
            Konto
          </span>
        </div>
        <div style={{ padding: '4px 0' }}>
          <Row icon={<Calendar size={14} />} label="Mitglied seit" value={formatDate(user.created_at)} />
          {user.last_login && (
            <Row icon={<LogIn size={14} />} label="Letzter Login" value={formatDateTime(user.last_login)} />
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--muted)' }}>
        {icon}
        <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}
