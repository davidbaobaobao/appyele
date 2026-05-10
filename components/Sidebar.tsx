'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, Layers, MessageSquare, Settings, LogOut, ShieldCheck, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { label: 'Inicio',         href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Mi negocio',     href: '/negocio',        icon: Building2 },
  { label: 'Contenido',      href: '/contenido',      icon: Layers },
  { label: 'Mensajes',       href: '/mensajes',       icon: MessageSquare },
  { label: 'Mi cuenta',      href: '/cuenta',         icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    async function loadClientData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? null)

      if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true)
      }

      const { data: client } = await supabase
        .from('clients')
        .select('business_name, id')
        .eq('user_id', user.id)
        .single()

      if (client) {
        setBusinessName(client.business_name)

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('author_role', 'studio')
          .eq('read', false)

        setUnreadCount(count ?? 0)
      }
    }

    loadClientData()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLink = (item: typeof NAV_ITEMS[0]) => {
    const Icon = item.icon
    const isActive =
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href))
    const isMessages = item.href === '/mensajes'

    return (
      <Link
        key={item.href}
        href={item.href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative"
        style={{
          fontFamily: 'var(--font-instrument)',
          fontWeight: isActive ? 500 : 400,
          color: isActive ? '#1D1D1F' : '#86868B',
          backgroundColor: isActive ? '#FFFFFF' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)'
            e.currentTarget.style.color = '#1D1D1F'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#86868B'
          }
        }}
      >
        <Icon size={16} strokeWidth={1.75} />
        <span>{item.label}</span>
        {isMessages && unreadCount > 0 && (
          <span
            className="ml-auto text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
            style={{ backgroundColor: '#C8A97E', color: '#FFFFFF' }}
          >
            {unreadCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl transition-colors"
        style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.08)' }}
        aria-label="Abrir menú"
      >
        {mobileOpen
          ? <X size={20} style={{ color: '#1D1D1F' }} />
          : <Menu size={20} style={{ color: '#1D1D1F' }} />
        }
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 h-full flex flex-col z-40 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          width: '240px',
          backgroundColor: '#F5F5F7',
          borderRight: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo + business name */}
        <div className="px-5 pt-6 pb-4">
          <div
            className="text-xl font-semibold mb-0.5"
            style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}
          >
            Yele
          </div>
          <div className="text-xs truncate" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
            {businessName ?? 'app.yele.design'}
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.08)', margin: '0 20px' }} />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(navLink)}
        </nav>

        {/* Admin section */}
        {isAdmin && (
          <div className="px-3 pb-2">
            <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <span
                className="text-xs uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
              >
                Admin
              </span>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-colors"
              style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)'
                e.currentTarget.style.color = '#1D1D1F'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#86868B'
              }}
            >
              <ShieldCheck size={16} strokeWidth={1.75} />
              <span>Panel admin</span>
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 pb-6" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px' }}>
          {email && (
            <p className="px-3 pb-2 text-xs truncate" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
              {email}
            </p>
          )}
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
    </>
  )
}
