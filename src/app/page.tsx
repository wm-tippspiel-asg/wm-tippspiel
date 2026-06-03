import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import LandingPage from '@/components/landing/LandingPage'

export const runtime = 'edge'

export default async function RootPage() {
  const user = await getCurrentUser()
  if (user) {
    if (user.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }
  return <LandingPage />
}
