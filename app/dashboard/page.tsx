'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Building2, Layers, MessageSquare, ExternalLink } from 'lucide-react'
import TopBar from '@/components/TopBar'

type ClientStatus = 'intake_pending' | 'building' | 'live' | 'paused'

interface Client {
  id: string
  business_name: string
  plan: string
  status: ClientStatus
  city: string
  website_url: string | null
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  intake_pending: { label: 'En revisión',      color: '#92400e', bg: 'rgba(180,120,40,0.10)' },
  building:       { label: 'En construcción',  color: '#1e40af', bg: 'rgba(30,64,175,0.08)'  },
  live:           { label: 'Activo',           color: '#065f46', bg: 'rgba(6,95,70,0.08)'    },
  paused:         { label: 'Pausado',          color: '#86868B', bg: 'rgba(0,0,0,0.06)'      },
}

const PLAN_LABELS: Record<string, string> = {
  basica: 'Básica', profesional: 'Profesional', avanzada: 'Avanzada',
}

const PLAN_BADGE: Record<string, { color: string; bg: string }> = {
  basica:      { color: '#86868B', bg: '#F5F5F7' },
  profesional: { color: '#FFFFFF', bg: '#1D1D1F' },
  avanzada:    { color: '#C8A97E', bg: 'rgba(200,169,126,0.15)' },
}

export default function DashboardPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClient() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error } = await supabase
          .from('clients')
          .select('id, business_name, plan, status, city, website_url')
          .eq('user_id', user.id)
          .single()

        if (error) console.error('dashboard fetch error:', error)
        setClient(data)
        setLoading(false)
      } catch (e) {
        console.error('dashboard loadClient threw:', e)
        setLoading(false)
      }
    }
    loadClient()
  }, [])

  const statusConfig = client
    ? (STATUS_CONFIG[client.status] ?? STATUS_CONFIG.intake_pending)
    : null

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Panel de control" />

      <div className="flex-1 p-6 space-y-6 max-w-5xl">

        {/* Status card skeleton */}
        {loading && (
          <div className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="h-5 w-48 rounded-lg mb-3" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <div className="h-4 w-32 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
          </div>
        )}

        {/* Status card */}
        {!loading && client && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2
                  className="text-xl font-semibold mb-1"
                  style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}
                >
                  {client.business_name}
                </h2>
                {client.city && (
                  <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>{client.city}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {client.plan && PLAN_BADGE[client.plan] && (
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: PLAN_BADGE[client.plan].bg, color: PLAN_BADGE[client.plan].color, fontFamily: 'var(--font-instrument)' }}
                  >
                    {PLAN_LABELS[client.plan] ?? client.plan}
                  </span>
                )}
                {statusConfig && (
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, fontFamily: 'var(--font-instrument)' }}
                  >
                    {statusConfig.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No client */}
        {!loading && !client && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
              No se encontró tu perfil de cliente. Contacta con el equipo de Yele.
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
          >
            Acciones rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/negocio',   icon: Building2,    title: 'Editar información',  desc: 'Horario, teléfono, descripción' },
              { href: '/contenido', icon: Layers,        title: 'Gestionar contenido', desc: 'Menú, galería, testimonios…' },
              { href: '/mensajes',  icon: MessageSquare, title: 'Mensajes',             desc: 'Contacta con el equipo' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-2xl p-5 flex items-start gap-4 transition-colors"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)' }}
                >
                  <div
                    className="mt-0.5 rounded-xl p-2 flex-shrink-0"
                    style={{ backgroundColor: 'rgba(200,169,126,0.12)' }}
                  >
                    <Icon size={16} style={{ color: '#C8A97E' }} />
                  </div>
                  <div>
                    <div
                      className="font-medium text-sm mb-0.5"
                      style={{ fontFamily: 'var(--font-instrument)', color: '#1D1D1F' }}
                    >
                      {action.title}
                    </div>
                    <div className="text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                      {action.desc}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Website section */}
        {!loading && client && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
            >
              Tu web
            </h3>

            {client.status === 'live' && client.website_url ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm font-mono" style={{ color: '#86868B' }}>
                  {client.website_url}
                </span>
                <a
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  Ver mi web <ExternalLink size={14} />
                </a>
              </div>
            ) : (
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                Tu web está en construcción.{' '}
                <span style={{ color: '#1D1D1F' }}>Te avisaremos cuando esté lista.</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
