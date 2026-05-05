'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, MessageSquare, LayoutGrid, LogOut, LayoutDashboard } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { label: 'Clientes',  href: '/admin/clientes',  icon: Users },
  { label: 'Mensajes',  href: '/admin/mensajes',  icon: MessageSquare },
  { label: 'Contenido', href: '/admin/contenido', icon: LayoutGrid },
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40"
      style={{ width: '240px', backgroundColor: '#F5F5F7', borderRight: '1px solid rgba(0,0,0,0.08)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div
          className="text-xl font-semibold mb-0.5"
          style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}
        >
          Yele
        </div>
        <div
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
        >
          Admin
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.08)', margin: '0 20px' }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon     = item.icon
          const isActive = isNavActive(item.href, pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-instrument)',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#1D1D1F' : '#86868B',
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#1D1D1F'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#86868B'
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
      <div
        className="px-3 pb-6 space-y-0.5"
        style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-colors"
          style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1D1D1F'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#86868B'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LayoutDashboard size={16} strokeWidth={1.75} />
          <span>Ver como cliente</span>
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-colors"
          style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1D1D1F'
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#86868B'
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
