import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminTopBar } from '@/components/admin/AdminTopBar'

export const runtime = 'edge'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="admin-shell">
      <AdminTopBar user={user} />
      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
