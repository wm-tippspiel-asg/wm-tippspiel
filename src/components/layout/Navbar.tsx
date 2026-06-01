'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, LogOut, User, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { AuthUser } from '@/types'

interface NavLink {
  href: string
  label: string
}

const userLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/predictions', label: 'Meine Tipps' },
  { href: '/leaderboard', label: 'Rangliste' },
  { href: '/about', label: 'Über das Spiel' },
]

const adminLinks: NavLink[] = [
  { href: '/admin', label: 'Übersicht' },
  { href: '/admin/matches', label: 'Spiele' },
  { href: '/admin/users', label: 'Nutzer' },
  { href: '/admin/codes', label: 'Zugangscodes' },
  { href: '/admin/logs', label: 'Audit-Logs' },
]

interface NavbarProps {
  user: AuthUser
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = user.role === 'admin' ? adminLinks : userLinks

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 mr-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm hidden sm:block text-slate-900 dark:text-slate-100">
              WM-Tippspiel
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 md:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* User menu (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href={user.role === 'admin' ? '/admin' : '/profile'}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-400
                           hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="font-medium">{user.username}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                           hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Abmelden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü öffnen"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0f] animate-fade-in">
          <nav className="p-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm transition-colors',
                  pathname === link.href
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="px-3 py-1.5 text-xs text-slate-400">
                Angemeldet als <span className="font-medium">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400
                           hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
