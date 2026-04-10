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
  intake_pending: { label: 'En revisión',      color: '#E8A020', bg: 'rgba(232,160,32,0.12)' },
  building:       { label: 'En construcción',  color: '#6BA8D4', bg: 'rgba(107,168,212,0.12)' },
  live:           { label: 'Activo',            color: '#2A8A5A', bg: 'rgba(42,138,90,0.12)' },
  paused:         { label: 'Pausado',           color: '#8A9BAD', bg: 'rgba(138,155,173,0.12)' },
}

const PLAN_LABELS: Record<string, string> = {
  basica:       'Básica',
  profesional:  'Profesional',
  avanzada:     'Avanzada',
}

export default function DashboardPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('clients')
        .select('id, business_name, plan, status, city, website_url')
        .eq('user_id', user.id)
        .single()

      if (error) console.error('dashboard fetch error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      })
      setClient(data)
      setLoading(false)
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
          <div
            className="rounded-xl p-6 animate-pulse"
            style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
          >
            <div className="h-5 w-48 rounded mb-3" style={{ backgroundColor: '#2D3F52' }} />
            <div className="h-4 w-32 rounded"    style={{ backgroundColor: '#2D3F52' }} />
          </div>
        )}

        {/* Status card */}
        {!loading && client && (
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2
                  className="text-xl font-semibold mb-1"
                  style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}
                >
                  {client.business_name}
                </h2>
                {client.city && (
                  <p className="text-sm" style={{ color: '#8A9BAD' }}>{client.city}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {client.plan && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(232,160,32,0.12)', color: '#E8A020' }}
                  >
                    {PLAN_LABELS[client.plan] ?? client.plan}
                  </span>
                )}
                {statusConfig && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No client row found */}
        {!loading && !client && (
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
          >
            <p className="text-sm" style={{ color: '#8A9BAD' }}>
              No se encontró tu perfil de cliente. Contacta con el equipo de Vitrina Studio.
            </p>
          </div>
        )}

        {/* Quick actions grid */}
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: '#8A9BAD' }}
          >
            Acciones rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/negocio',   icon: Building2,     title: 'Editar información',  desc: 'Horario, teléfono, descripción' },
              { href: '/contenido', icon: Layers,         title: 'Gestionar contenido', desc: 'Menú, galería, testimonios…' },
              { href: '/mensajes',  icon: MessageSquare,  title: 'Mensajes',             desc: 'Contacta con el equipo' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-xl p-5 flex items-start gap-4 transition-colors"
                  style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(232,160,32,0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(45,63,82,0.4)' }}
                >
                  <div
                    className="mt-0.5 rounded-lg p-2 flex-shrink-0"
                    style={{ backgroundColor: 'rgba(232,160,32,0.1)' }}
                  >
                    <Icon size={16} style={{ color: '#E8A020' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: '#F5F2EE' }}>
                      {action.title}
                    </div>
                    <div className="text-xs" style={{ color: '#8A9BAD' }}>{action.desc}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Website section */}
        {!loading && client && (
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: '#8A9BAD' }}
            >
              Tu web
            </h3>

            {client.status === 'live' && client.website_url ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm font-mono" style={{ color: '#8A9BAD' }}>
                  {client.website_url}
                </span>
                <a
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{ backgroundColor: '#E8A020', color: '#0F1923' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B87A10' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E8A020' }}
                >
                  Ver mi web <ExternalLink size={14} />
                </a>
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#8A9BAD' }}>
                Tu web está en construcción.{' '}
                <span style={{ color: '#F5F2EE' }}>Te avisaremos cuando esté lista.</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
