'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Mail, LogOut } from 'lucide-react'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'

const PLAN_INFO: Record<string, { label: string; description: string }> = {
  basica:       { label: 'Plan Básica',       description: 'Hasta 4 páginas' },
  profesional:  { label: 'Plan Profesional',  description: 'Hasta 6 páginas' },
  avanzada:     { label: 'Plan Avanzada',     description: 'Sin límite de páginas' },
}

export default function CuentaPage() {
  const router = useRouter()
  const [email, setEmail]           = useState<string | null>(null)
  const [plan, setPlan]             = useState<string | null>(null)
  const [createdAt, setCreatedAt]   = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? null)

      const { data: client, error } = await supabase
        .from('clients')
        .select('plan, created_at, business_name')
        .eq('user_id', user.id)
        .single()

      if (error) console.error('cuenta fetch error:', error)

      if (client) {
        setPlan(client.plan)
        setCreatedAt(client.created_at)
        setBusinessName(client.business_name)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  const planInfo = plan ? PLAN_INFO[plan] : null

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0F1923' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col" style={{ marginLeft: '220px' }}>
        <TopBar title="Mi cuenta" />

        <div className="flex-1 p-6 max-w-2xl space-y-6">
          <div>
            <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}>
              Mi cuenta
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: '#1E2B3A' }} />
              ))}
            </div>
          ) : (
            <>
              {/* Account info card */}
              <div
                className="rounded-xl p-6 space-y-4"
                style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
              >
                {businessName && (
                  <>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8A9BAD' }}>Negocio</div>
                      <div className="text-sm font-semibold" style={{ color: '#F5F2EE' }}>{businessName}</div>
                    </div>
                    <div className="h-px" style={{ backgroundColor: 'rgba(45,63,82,0.4)' }} />
                  </>
                )}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8A9BAD' }}>Email</div>
                  <div className="text-sm" style={{ color: '#F5F2EE' }}>{email}</div>
                </div>

                <div className="h-px" style={{ backgroundColor: 'rgba(45,63,82,0.4)' }} />

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8A9BAD' }}>Plan actual</div>
                  {planInfo ? (
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(232,160,32,0.12)', color: '#E8A020' }}
                      >
                        {planInfo.label}
                      </span>
                      <span className="text-sm" style={{ color: '#8A9BAD' }}>{planInfo.description}</span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: '#8A9BAD' }}>Sin plan asignado</span>
                  )}
                </div>

                {createdAt && (
                  <>
                    <div className="h-px" style={{ backgroundColor: 'rgba(45,63,82,0.4)' }} />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8A9BAD' }}>Miembro desde</div>
                      <div className="text-sm" style={{ color: '#F5F2EE' }}>{formatDate(createdAt)}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Help section */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
              >
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#F5F2EE' }}>¿Necesitas ayuda?</h3>
                <div className="space-y-3">
                  <Link
                    href="/mensajes"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F2EE' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                  >
                    <MessageSquare size={16} style={{ color: '#8A9BAD' }} />
                    Enviar un mensaje
                  </Link>
                  <a
                    href="mailto:hola@vitrinastudio.com"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F2EE' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                  >
                    <Mail size={16} style={{ color: '#8A9BAD' }} />
                    hola@vitrinastudio.com
                  </a>
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'rgba(196,58,42,0.1)', border: '1px solid rgba(196,58,42,0.3)', color: '#C43A2A' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(196,58,42,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(196,58,42,0.1)' }}
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
