'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Mail, LogOut } from 'lucide-react'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'

const PLAN_INFO: Record<string, { label: string; description: string }> = {
  basica:      { label: 'Plan Básica',      description: 'Hasta 4 páginas' },
  profesional: { label: 'Plan Profesional', description: 'Hasta 6 páginas' },
  avanzada:    { label: 'Plan Avanzada',    description: 'Sin límite de páginas' },
}

const PLAN_BADGE: Record<string, { color: string; bg: string }> = {
  basica:      { color: '#86868B', bg: '#F5F5F7' },
  profesional: { color: '#FFFFFF', bg: '#1D1D1F' },
  avanzada:    { color: '#C8A97E', bg: 'rgba(200,169,126,0.15)' },
}

export default function CuentaPage() {
  const router = useRouter()
  const [email, setEmail]               = useState<string | null>(null)
  const [plan, setPlan]                 = useState<string | null>(null)
  const [createdAt, setCreatedAt]       = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? null)

      const { data: client, error } = await supabase
        .from('clients').select('plan, created_at, business_name').eq('user_id', user.id).single()

      if (error) console.error('cuenta fetch error:', error)
      if (client) { setPlan(client.plan); setCreatedAt(client.created_at); setBusinessName(client.business_name) }
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

  const planInfo  = plan ? PLAN_INFO[plan]  : null
  const planBadge = plan ? PLAN_BADGE[plan] : null

  const rowLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#86868B', marginBottom: '4px', fontFamily: 'var(--font-instrument)',
  }
  const rowValue: React.CSSProperties = {
    fontSize: '14px', color: '#1D1D1F', fontFamily: 'var(--font-instrument)',
  }
  const divider: React.CSSProperties = {
    height: '1px', backgroundColor: 'rgba(0,0,0,0.06)', margin: '4px 0',
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main">
        <TopBar title="Mi cuenta" />

        <div className="flex-1 p-6 max-w-2xl space-y-6">
          <div>
            <h2 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
              Mi cuenta
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: '#F5F5F7' }} />
              ))}
            </div>
          ) : (
            <>
              {/* Account info card */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                {businessName && (
                  <>
                    <div>
                      <div style={rowLabel}>Negocio</div>
                      <div style={rowValue}>{businessName}</div>
                    </div>
                    <div style={divider} />
                  </>
                )}

                <div>
                  <div style={rowLabel}>Email</div>
                  <div style={rowValue}>{email}</div>
                </div>

                <div style={divider} />

                <div>
                  <div style={{ ...rowLabel, marginBottom: '8px' }}>Plan actual</div>
                  {planInfo && planBadge ? (
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full"
                        style={{ backgroundColor: planBadge.bg, color: planBadge.color, fontFamily: 'var(--font-instrument)' }}
                      >
                        {planInfo.label}
                      </span>
                      <span style={{ ...rowValue, color: '#86868B' }}>{planInfo.description}</span>
                    </div>
                  ) : (
                    <span style={{ ...rowValue, color: '#86868B' }}>Sin plan asignado</span>
                  )}
                </div>

                {createdAt && (
                  <>
                    <div style={divider} />
                    <div>
                      <div style={rowLabel}>Miembro desde</div>
                      <div style={rowValue}>{formatDate(createdAt)}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Help section */}
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
                  ¿Necesitas ayuda?
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/mensajes"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', color: '#1D1D1F', fontFamily: 'var(--font-instrument)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
                  >
                    <MessageSquare size={16} style={{ color: '#86868B' }} />
                    Enviar un mensaje
                  </Link>
                  <a
                    href="mailto:hola@yele.design"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', color: '#1D1D1F', fontFamily: 'var(--font-instrument)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
                  >
                    <Mail size={16} style={{ color: '#86868B' }} />
                    hola@yele.design
                  </a>
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #fecaca',
                  color: '#ef4444',
                  fontFamily: 'var(--font-instrument)',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
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
