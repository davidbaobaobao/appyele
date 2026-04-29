'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, LogOut, LayoutDashboard, LayoutGrid } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Red-orange accent to distinguish admin from client view
const ACCENT = '#E05A2B'
const ACCENT_BG = 'rgba(224,90,43,0.08)'
const ACCENT_BORDER = '#E05A2B'

const NAV_ITEMS = [
  { label: 'Clientes',  href: '/admin',           icon: Users },
  { label: 'Contenido', href: '/admin/contenido',  icon: LayoutGrid },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40"
      style={{ width: '220px', backgroundColor: '#1E2B3A', borderRight: '1px solid rgba(45,63,82,0.4)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="text-xl mb-0.5" style={{ fontFamily: 'var(--font-dm-serif)', color: ACCENT }}>
          Vitrina<span>·</span>
        </div>
        <div
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: ACCENT, opacity: 0.7 }}
        >
          Admin
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(45,63,82,0.4)', margin: '0 20px' }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          // /admin: matches exactly or /admin/[clientId] (uuid routes), but NOT /admin/contenido
          const isActive = item.href === '/admin'
            ? (pathname === '/admin' || (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/contenido')))
            : (pathname === item.href || pathname.startsWith(item.href + '/'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: isActive ? ACCENT : '#8A9BAD',
                backgroundColor: isActive ? ACCENT_BG : 'transparent',
                borderLeft: isActive ? `2px solid ${ACCENT_BORDER}` : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#F5F2EE'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#8A9BAD'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-6 space-y-1">
        {/* Switch to client view */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
          style={{ color: '#8A9BAD' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#F5F2EE'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8A9BAD'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LayoutDashboard size={16} strokeWidth={1.75} />
          <span>Ver como cliente</span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
          style={{ color: '#8A9BAD' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#F5F2EE'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8A9BAD'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
