'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Trophy, Key, FileText,
  BarChart2, Star, Users2, ArrowLeft, Shield,
} from 'lucide-react'
import type { AuthUser } from '@/types'

const NAV = [
  { href: '/admin',              icon: LayoutDashboard, label: 'Übersicht',    exact: true },
  { href: '/admin/users',        icon: Users,           label: 'Nutzer' },
  { href: '/admin/matches',      icon: Trophy,          label: 'Spiele' },
  { href: '/admin/codes',        icon: Key,             label: 'Codes' },
  { href: '/admin/gruppen',      icon: Users2,          label: 'Gruppen' },
  { href: '/admin/special-bets', icon: Star,            label: 'Sondertipps' },
  { href: '/admin/stats',        icon: BarChart2,       label: 'Statistiken' },
  { href: '/admin/logs',         icon: FileText,        label: 'Logs' },
]

export function AdminSidebar({ user }: { user: AuthUser }) {
  const path = usePathname()
  const isActive = (href: string, exact?: boolean) =>
    exact ? path === href : path.startsWith(href)

  const initial = (user.username[0] ?? '?').toUpperCase()

  return (
    <>
      {/* ── Sidebar (desktop + tablet) ── */}
      <aside className="admin-sidebar">

        {/* Logo */}
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">
            <Shield size={15} />
          </div>
          <div className="admin-sidebar-logo-text">
            <div className="admin-sidebar-logo-title">Admin</div>
            <div className="admin-sidebar-logo-sub">WM 2026</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="admin-nav">
          <div className="admin-nav-section-label">Panel</div>
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`admin-nav-item${active ? ' admin-nav-active' : ''}`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span className="admin-nav-label">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          <Link href="/dashboard" className="admin-back-link" title="Zur App">
            <ArrowLeft size={14} />
            <span className="admin-nav-label">Zur App</span>
          </Link>
          <div className="admin-sidebar-user" title={user.username}>
            <div className="admin-sidebar-avatar">{initial}</div>
            <span className="admin-sidebar-username admin-nav-label">{user.username}</span>
          </div>
        </div>
      </aside>

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="admin-bottom-nav">
        {NAV.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`admin-bottom-nav-item${active ? ' admin-nav-active' : ''}`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
