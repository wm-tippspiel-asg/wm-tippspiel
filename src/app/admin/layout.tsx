import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const runtime = 'edge'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="admin-shell">
      <AdminSidebar user={user} />
      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
