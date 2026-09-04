'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Mail, LogOut } from 'lucide-react'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'

const PLAN_INFO: Record<string, { label: string; description: string }> = {
  basica:      { label: 'Starter plan',  description: 'Up to 4 pages' },
  profesional: { label: 'Pro plan',      description: 'Up to 6 pages' },
  avanzada:    { label: 'Advanced plan', description: 'Unlimited pages' },
}

const PLAN_BADGE: Record<string, { color: string; bg: string }> = {
  basica:      { color: '#8A8A92', bg: '#F2F0EB' },
  profesional: { color: '#FFFFFF', bg: '#16161A' },
  avanzada:    { color: '#D46FC8', bg: 'rgba(212,111,200,0.15)' },
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
    new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  const planInfo  = plan ? PLAN_INFO[plan]  : null
  const planBadge = plan ? PLAN_BADGE[plan] : null

  const rowValue: React.CSSProperties = {
    fontSize: '14px', color: '#16161A', fontFamily: 'var(--font-instrument)',
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F7F6F3' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main">
        <TopBar title="My account" />

        <div className="flex-1 p-6 max-w-2xl space-y-6">
          <div>
            <h2 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
              My account
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: '#EEEDE9' }} />
              ))}
            </div>
          ) : (
            <>
              {/* Account info card */}
              <div className="yele-card-quiet p-6 space-y-4">
                {businessName && (
                  <>
                    <div>
                      <div className="yele-eyebrow mb-1">Business</div>
                      <div style={rowValue}>{businessName}</div>
                    </div>
                    <hr className="yele-rule" />
                  </>
                )}

                <div>
                  <div className="yele-eyebrow mb-1">Email</div>
                  <div style={rowValue}>{email}</div>
                </div>

                <hr className="yele-rule" />

                <div>
                  <div className="yele-eyebrow mb-2">Current plan</div>
                  {planInfo && planBadge ? (
                    <div className="flex items-center gap-3">
                      <span
                        className="yele-pill"
                        style={{ backgroundColor: planBadge.bg, color: planBadge.color }}
                      >
                        {planInfo.label}
                      </span>
                      <span style={{ ...rowValue, color: '#8A8A92' }}>{planInfo.description}</span>
                    </div>
                  ) : (
                    <span style={{ ...rowValue, color: '#8A8A92' }}>No plan assigned</span>
                  )}
                </div>

                {createdAt && (
                  <>
                    <hr className="yele-rule" />
                    <div>
                      <div className="yele-eyebrow mb-1">Member since</div>
                      <div style={rowValue}>{formatDate(createdAt)}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Help section */}
              <div className="yele-card-quiet p-6">
                <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
                  Need help?
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Link href="/mensajes" className="yele-btn yele-btn-secondary">
                    <MessageSquare size={16} style={{ color: '#8A8A92' }} />
                    Send a message
                  </Link>
                  <a href="mailto:hola@yele.design" className="yele-btn yele-btn-secondary">
                    <Mail size={16} style={{ color: '#8A8A92' }} />
                    hola@yele.design
                  </a>
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="yele-btn"
                style={{
                  backgroundColor: 'rgba(179,56,43,0.09)',
                  border: '1px solid rgba(179,56,43,0.20)',
                  color: '#B3382B',
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
