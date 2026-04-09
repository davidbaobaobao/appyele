'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, Layers, MessageSquare, Settings, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { label: 'Inicio',    href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Mi negocio', href: '/negocio',   icon: Building2 },
  { label: 'Contenido', href: '/contenido',  icon: Layers },
  { label: 'Mensajes',  href: '/mensajes',   icon: MessageSquare },
  { label: 'Mi cuenta', href: '/cuenta',     icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function loadClientData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40"
      style={{ width: '220px', backgroundColor: '#1E2B3A', borderRight: '1px solid rgba(45,63,82,0.4)' }}
    >
      {/* Logo + client name */}
      <div className="px-5 pt-6 pb-4">
        <div
          className="text-xl mb-1"
          style={{ fontFamily: 'var(--font-dm-serif)', color: '#E8A020' }}
        >
          Vitrina<span>·</span>
        </div>
        {businessName && (
          <div className="text-xs truncate" style={{ color: '#8A9BAD' }}>
            {businessName}
          </div>
        )}
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(45,63,82,0.4)', margin: '0 20px' }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const isMessages = item.href === '/mensajes'

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
              style={{
                color: isActive ? '#E8A020' : '#8A9BAD',
                backgroundColor: isActive ? 'rgba(232,160,32,0.06)' : 'transparent',
                borderLeft: isActive ? '2px solid #E8A020' : '2px solid transparent',
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
              {isMessages && unreadCount > 0 && (
                <span
                  className="ml-auto text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
                  style={{ backgroundColor: '#E8A020', color: '#0F1923' }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
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
