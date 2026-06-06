import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import { PresenceTracker } from '@/components/PresenceTracker'

export const runtime = 'edge'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.is_banned) redirect('/login?banned=1')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} />
      <PresenceTracker />
      <main className="shell" style={{ paddingTop: 32, paddingBottom: 96 }}>
        {children}
      </main>
    </div>
  )
}
