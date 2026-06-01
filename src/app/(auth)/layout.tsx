import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Trophy } from 'lucide-react'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">WM-Tippspiel 2026</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="text-center py-5 text-sm text-gray-400 dark:text-gray-600">
        © {new Date().getFullYear()} WM-Tippspiel 2026 — Nur für den Schulgebrauch
      </footer>
    </div>
  )
}
