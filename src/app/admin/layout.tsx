import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'

export const runtime = 'edge'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="admin-shell">
      <Navbar user={user} />
      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
