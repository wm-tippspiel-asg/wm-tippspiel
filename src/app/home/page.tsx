import LandingPage from '@/components/landing/LandingPage'
import type { Metadata } from 'next'

export const runtime = 'edge'
export const metadata: Metadata = { title: 'WM Tippspiel ASG 2026' }

export default function HomePage() {
  return <LandingPage />
}
