'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, LogOut, User, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { AuthUser } from '@/types'

const userLinks = [
  { href: '/dashboard',   label: 'Dashboard' },
  { href: '/predictions', label: 'Meine Tipps' },
  { href: '/leaderboard', label: 'Rangliste' },
  { href: '/about',       label: 'Regeln' },
]

const adminLinks = [
  { href: '/admin',         label: 'Übersicht' },
  { href: '/admin/matches', label: 'Spiele' },
  { href: '/admin/users',   label: 'Nutzer' },
  { href: '/admin/codes',   label: 'Codes' },
  { href: '/admin/logs',    label: 'Logs' },
]

export function Navbar({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const links = user.role === 'admin' ? adminLinks : userLinks

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#2a2a2a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">

          {/* Logo */}
          <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}
            className="flex items-center gap-2.5 shrink-0 font-bold text-gray-900 dark:text-gray-100">
            <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
              <Trophy className="h-4.5 w-4.5 text-white" aria-hidden />
            </div>
            <span className="hidden sm:block text-base">WM 2026</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-base font-medium transition-colors',
                  isActive(l.href)
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#222]',
                )}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 md:hidden" />

          {/* Right */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              <Link href={user.role === 'admin' ? '/admin' : '/profile'}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors">
                <User className="h-4 w-4" />
                {user.username}
              </Link>
              <button onClick={logout} aria-label="Abmelden"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
              onClick={() => setOpen(!open)} aria-label="Menü">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] fade-in">
          <nav className="p-3 space-y-0.5">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors',
                  isActive(l.href)
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]',
                )}>
                {l.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
              <p className="px-4 py-1.5 text-sm text-gray-500">
                Eingeloggt als <strong>{user.username}</strong>
              </p>
              <button onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium
                           text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
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
