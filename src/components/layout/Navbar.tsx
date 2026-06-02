'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Trophy, Target, BookOpen, Users, Calendar, Key, FileText, LogOut, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { AuthUser } from '@/types'

const userLinks = [
  { href: '/dashboard',     label: 'Start',      icon: LayoutDashboard },
  { href: '/predictions',   label: 'Tippen',     icon: Target },
  { href: '/special-bets',  label: 'Sondertipps',icon: Trophy },
  { href: '/groups',        label: 'Ergebnisse', icon: Trophy },
  { href: '/leaderboard',   label: 'Rangliste',  icon: Trophy },
  { href: '/about',         label: 'Regeln',     icon: BookOpen },
]

const adminLinks = [
  { href: '/admin',               label: 'Übersicht',   icon: LayoutDashboard },
  { href: '/admin/matches',       label: 'Spiele',      icon: Calendar },
  { href: '/admin/special-bets',  label: 'Sondertipps', icon: Trophy },
  { href: '/admin/users',         label: 'Nutzer',      icon: Users },
  { href: '/admin/gruppen',       label: 'Gruppen',     icon: Users },
  { href: '/admin/codes',         label: 'Codes',       icon: Key },
  { href: '/admin/logs',          label: 'Logs',        icon: FileText },
]

function ThemeBtn() {
  const [dark, setDark] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    setReady(true)
  }, [])
  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
  }
  if (!ready) return <div style={{ width: 36, height: 36 }} />
  return (
    <button onClick={toggle} aria-label="Theme wechseln"
      style={{ border: 0, background: 'var(--surface-2)', borderRadius: 10, width: 36, height: 36,
               display: 'grid', placeItems: 'center', color: 'var(--ink-2)', cursor: 'pointer' }}>
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

export function Navbar({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const links = user.role === 'admin' ? adminLinks : userLinks

  const isActive = (href: string) =>
    pathname === href || (href.length > 10 && pathname.startsWith(href))

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <>
      {/* Desktop nav */}
      <header className="wm-nav">
        <div className="shell">
          <div className="wm-nav-inner">
            {/* Brand */}
            <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="wm-brand">
              <img src="/logo.png" alt="WM Tippspiel Logo"
                style={{ height: 36, width: 36, borderRadius: 8, objectFit: 'contain' }} />
              <div>
                WM 2026
                <small>Tippspiel</small>
              </div>
            </Link>

            {/* Tabs */}
            <nav className="wm-nav-tabs">
              {links.map((l) => (
                <Link key={l.href} href={l.href}
                  className={`wm-nav-tab ${isActive(l.href) ? 'active' : ''}`}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Right */}
            <div className="wm-nav-right">
              <ThemeBtn />
              <Link href={user.role === 'admin' ? '/admin' : '/profile'}
                style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none',
                         padding: '6px 12px 6px 6px', borderRadius: 99,
                         border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="wm-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{initials}</div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{user.username}</span>
              </Link>
              <button onClick={logout} aria-label="Abmelden"
                style={{ border: 0, background: 'transparent', color: 'var(--muted)', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tabbar */}
      <nav className="wm-tabbar">
        {links.map((l) => {
          const Icon = l.icon
          return (
            <Link key={l.href} href={l.href}
              className={`wm-tabbar-btn ${isActive(l.href) ? 'active' : ''}`}>
              <Icon size={22} />
              {l.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
