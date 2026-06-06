'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Trophy, Key, FileText,
  BarChart2, Star, Users2, ArrowLeft, Moon, Sun,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { AuthUser } from '@/types'

const NAV = [
  { href: '/admin',              icon: LayoutDashboard, label: 'Übersicht',  exact: true },
  { href: '/admin/users',        icon: Users,           label: 'Nutzer' },
  { href: '/admin/matches',      icon: Trophy,          label: 'Spiele' },
  { href: '/admin/codes',        icon: Key,             label: 'Codes' },
  { href: '/admin/gruppen',      icon: Users2,          label: 'Gruppen' },
  { href: '/admin/special-bets', icon: Star,            label: 'Sondertipps' },
  { href: '/admin/stats',        icon: BarChart2,       label: 'Statistiken' },
  { href: '/admin/logs',         icon: FileText,        label: 'Logs' },
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
  if (!ready) return <div style={{ width: 32, height: 32 }} />
  return (
    <button onClick={toggle} className="admin-topbar-icon-btn" aria-label="Theme">
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

export function AdminTopBar({ user }: { user: AuthUser }) {
  const path = usePathname()
  const isActive = (href: string, exact?: boolean) =>
    exact ? path === href : path.startsWith(href)
  const initial = (user.username[0] ?? '?').toUpperCase()

  return (
    <>
      {/* ── Top bar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar-inner">

          {/* Brand */}
          <div className="admin-topbar-brand">
            <img src="/logo.png" alt="Logo" className="admin-topbar-logo-img" />
            <span className="admin-topbar-brand-text">Admin</span>
          </div>

          {/* Nav tabs */}
          <nav className="admin-topbar-nav">
            {NAV.map(({ href, icon: Icon, label, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`admin-topbar-tab${active ? ' admin-topbar-tab--active' : ''}`}
                >
                  <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right */}
          <div className="admin-topbar-right">
            <ThemeBtn />
            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">{initial}</div>
              <span className="admin-topbar-username">{user.username}</span>
            </div>
            <Link href="/dashboard" className="admin-topbar-back">
              <ArrowLeft size={14} />
              <span>App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom tabs ── */}
      <nav className="admin-bottom-nav">
        {NAV.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`admin-bottom-tab${active ? ' admin-bottom-tab--active' : ''}`}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
