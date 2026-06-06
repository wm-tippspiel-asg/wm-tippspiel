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
  { href: '/admin/codes',        icon: Key,             label: 'Zugangscodes' },
  { href: '/admin/gruppen',      icon: Users2,          label: 'Gruppen' },
  { href: '/admin/special-bets', icon: Star,            label: 'Sondertipps' },
  { href: '/admin/stats',        icon: BarChart2,       label: 'Statistiken' },
  { href: '/admin/logs',         icon: FileText,        label: 'Audit-Logs' },
]

export function AdminSidebar({ user }: { user: AuthUser }) {
  const path = usePathname()
  const isActive = (href: string, exact?: boolean) =>
    exact ? path === href : path.startsWith(href)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">
            <Shield size={16} />
          </div>
          <div>
            <div className="admin-sidebar-logo-title">Admin</div>
            <div className="admin-sidebar-logo-sub">WM-Tippspiel</div>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-label">Verwaltung</div>
          {NAV.map(({ href, icon: Icon, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={`admin-nav-item${isActive(href, exact) ? ' admin-nav-active' : ''}`}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {(user.username[0] ?? '?').toUpperCase()}
            </div>
            <span className="admin-sidebar-username">{user.username}</span>
          </div>
          <Link href="/dashboard" className="admin-back-link">
            <ArrowLeft size={13} />
            Zur App
          </Link>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="admin-mobile-header">
        <div className="admin-mobile-logo">
          <Shield size={14} />
          Admin
        </div>
        <Link href="/dashboard" className="admin-mobile-back">
          <ArrowLeft size={14} />
          App
        </Link>
      </div>
      <div className="admin-mobile-nav">
        {NAV.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={`admin-mobile-nav-item${isActive(href, exact) ? ' admin-nav-active' : ''}`}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </Link>
        ))}
      </div>
    </>
  )
}
