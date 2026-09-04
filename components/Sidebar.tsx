'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, Layers, MessageSquare, Settings, LogOut, ShieldCheck, Menu, X, Palette } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import SupportButton from '@/components/SupportButton'

const NAV_ITEMS = [
  { label: 'Home',        href: '/dashboard', icon: LayoutDashboard },
  { label: 'My business', href: '/negocio',   icon: Building2 },
  { label: 'Content',     href: '/contenido', icon: Layers },
  { label: 'Messages',    href: '/mensajes',  icon: MessageSquare },
  { label: 'My account',  href: '/cuenta',    icon: Settings },
]

const DESIGN_STATUSES = ['building', 'revision']

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
  }

  return (
    <>
      <SupportButton />

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl transition-colors"
        style={{ backgroundColor: '#F2F0EB', border: '1px solid rgba(22,22,26,0.08)' }}
        aria-label="Toggle menu"
      >
        {mobileOpen
          ? <X size={20} style={{ color: '#16161A' }} />
          : <Menu size={20} style={{ color: '#16161A' }} />
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
          backgroundColor: '#F2F0EB',
          borderRight: '1px solid rgba(22,22,26,0.08)',
        }}
      >
        {/* Logo + business name */}
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
          <div className="text-xs truncate" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
            {businessName ?? 'app.yele.design'}
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'rgba(22,22,26,0.08)', margin: '0 20px' }} />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(navLink)}
          {clientStatus && DESIGN_STATUSES.includes(clientStatus) && (() => {
            const isActive = pathname === '/diseno' || pathname.startsWith('/diseno/')
            return (
              <Link
                href="/diseno"
                className="yele-nav-item"
                data-active={isActive}
              >
                <Palette size={16} strokeWidth={1.75} />
                <span>Design</span>
              </Link>
            )
          })()}
        </nav>

        {/* Admin section */}
        {isAdmin && (
          <div className="px-3 pb-2">
            <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(22,22,26,0.08)' }}>
              <span className="yele-eyebrow">Admin</span>
            </div>
            <Link
              href="/admin"
              className="yele-nav-item w-full"
            >
              <ShieldCheck size={16} strokeWidth={1.75} />
              <span>Admin panel</span>
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(22,22,26,0.08)', paddingTop: '12px' }}>
          {email && (
            <p className="px-3 pb-2 text-xs truncate" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
              {email}
            </p>
          )}
          <button
            onClick={handleSignOut}
            className="yele-nav-item w-full"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>

          {/* Legal links */}
          <div className="px-3 pt-3 flex items-center gap-2 flex-wrap" style={{ borderTop: '1px solid rgba(22,22,26,0.06)', marginTop: '8px' }}>
            <Link
              href="/politica-de-privacidad"
              className="text-xs transition-colors"
              style={{ fontFamily: 'var(--font-instrument)', color: '#D6D3CC' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#8A8A92' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#D6D3CC' }}
            >
              Privacy
            </Link>
            <span className="text-xs" style={{ color: '#D6D3CC' }}>·</span>
            <Link
              href="/terminos-de-uso"
              className="text-xs transition-colors"
              style={{ fontFamily: 'var(--font-instrument)', color: '#D6D3CC' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#8A8A92' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#D6D3CC' }}
            >
              Terms of use
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
