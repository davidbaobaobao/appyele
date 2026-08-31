'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, Layers, ShoppingBag, MessageSquare, Settings, LogOut, ShieldCheck, Menu, X, Palette } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import SupportButton from '@/components/SupportButton'

const NAV_ITEMS = [
  { label: 'Inicio',         href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Mi negocio',     href: '/negocio',        icon: Building2 },
  { label: 'Contenido',      href: '/contenido',      icon: Layers },
  { label: 'Store',          href: '/store',          icon: ShoppingBag },
  { label: 'Mensajes',       href: '/mensajes',       icon: MessageSquare },
  { label: 'Mi cuenta',      href: '/cuenta',         icon: Settings },
]

const DISENO_STATUSES = ['building', 'revision']

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [clientStatus, setClientStatus] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasStore, setHasStore] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Initial load — profile data only (runs once)
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
        .select('business_name, id, status')
        .eq('user_id', user.id)
        .single()

      if (client) {
        setBusinessName(client.business_name)
        setClientStatus(client.status ?? null)
        setClientId(client.id)

        // The Store nav item only shows for clients that have a store.
        const { count: storeCount } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)

        setHasStore((storeCount ?? 0) > 0)
      }
    }

    loadClientData()
  }, [])

  // Unread count — refresh on every route change + poll every 30 s
  const refreshUnread = useCallback(async (cid: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', cid)
      .eq('author_role', 'studio')
      .eq('read', false)
    setUnreadCount(count ?? 0)
  }, [])

  useEffect(() => {
    if (!clientId) return
    // When on the messages page the client page already marks messages read —
    // reset the badge immediately so it never stays stale.
    if (pathname === '/mensajes') {
      setUnreadCount(0)
      return
    }
    refreshUnread(clientId)
    const interval = setInterval(() => refreshUnread(clientId), 30_000)
    return () => clearInterval(interval)
  }, [clientId, pathname, refreshUnread])

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
      <SupportButton />

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
          {NAV_ITEMS.filter((item) => item.href !== '/store' || hasStore).map(navLink)}
          {clientStatus && DISENO_STATUSES.includes(clientStatus) && (() => {
            const isActive = pathname === '/diseno' || pathname.startsWith('/diseno/')
            return (
              <Link
                href="/diseno"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
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
                <Palette size={16} strokeWidth={1.75} />
                <span>Diseño</span>
              </Link>
            )
          })()}
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
        <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px' }}>
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

          {/* Legal links */}
          <div className="px-3 pt-3 flex items-center gap-2 flex-wrap" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '8px' }}>
            <Link
              href="/politica-de-privacidad"
              className="text-xs transition-colors"
              style={{ fontFamily: 'var(--font-instrument)', color: '#C7C7CC' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#86868B' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#C7C7CC' }}
            >
              Privacidad
            </Link>
            <span className="text-xs" style={{ color: '#C7C7CC' }}>·</span>
            <Link
              href="/terminos-de-uso"
              className="text-xs transition-colors"
              style={{ fontFamily: 'var(--font-instrument)', color: '#C7C7CC' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#86868B' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#C7C7CC' }}
            >
              Términos de uso
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
