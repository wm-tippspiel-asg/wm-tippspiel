import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Trophy } from 'lucide-react'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">WM-Tippspiel</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} WM-Tippspiel — Nur für den Schulgebrauch
      </footer>
    </div>
  )
}
