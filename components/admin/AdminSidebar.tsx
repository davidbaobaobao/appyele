'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, MessageSquare, LayoutGrid, LogOut, LayoutDashboard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'

const NAV_ITEMS = [
  { label: 'Clients',  href: '/admin/clientes',  icon: Users },
  { label: 'Messages', href: '/admin/mensajes',  icon: MessageSquare },
  { label: 'Content',  href: '/admin/contenido', icon: LayoutGrid },
]

function isNavActive(href: string, pathname: string) {
  if (href === '/admin/clientes') {
    return pathname === '/admin/clientes' || pathname.startsWith('/admin/clientes/')
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/unread-count')
      if (!res.ok) return
      const { count } = await res.json()
      setUnreadCount(count ?? 0)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    // When viewing the messages page, conversations get marked read — reset immediately.
    if (pathname === '/admin/mensajes') {
      setUnreadCount(0)
      return
    }
    refreshUnread()
    const interval = setInterval(refreshUnread, 30_000)
    return () => clearInterval(interval)
  }, [pathname, refreshUnread])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40"
      style={{ width: '240px', backgroundColor: '#F2F0EB', borderRight: '1px solid rgba(22,22,26,0.08)' }}
    >
      {/* Logo + section label */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#16161A' }}
            aria-hidden
          >
            <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: '#D46FC8' }} />
          </span>
          <span
            className="text-xl font-semibold leading-none"
            style={{ fontFamily: 'var(--font-display)', color: '#16161A', letterSpacing: '-0.02em' }}
          >
            yele
          </span>
        </div>
        <span className="yele-eyebrow">Admin</span>
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(22,22,26,0.08)', margin: '0 20px' }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon       = item.icon
          const isActive   = isNavActive(item.href, pathname)
          const isMessages = item.href === '/admin/mensajes'

          return (
            <Link
              key={item.href}
              href={item.href}
              className="yele-nav-item relative"
              data-active={isActive}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span>{item.label}</span>
              {isMessages && unreadCount > 0 && (
                <span
                  className="ml-auto text-[11px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
                  style={{ backgroundColor: '#D46FC8', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div
        className="px-3 pb-6 space-y-0.5"
        style={{ borderTop: '1px solid rgba(22,22,26,0.08)', paddingTop: '12px' }}
      >
        <Link href="/dashboard" className="yele-nav-item w-full">
          <LayoutDashboard size={16} strokeWidth={1.75} />
          <span>View as client</span>
        </Link>

        <button onClick={handleSignOut} className="yele-nav-item w-full">
          <LogOut size={16} strokeWidth={1.75} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
