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
  intake_pending: { label: 'In review',   color: '#8A5A16', bg: 'rgba(138,90,22,0.10)' },
  building:       { label: 'In progress', color: '#2B4FA8', bg: 'rgba(43,79,168,0.09)' },
  live:           { label: 'Live',        color: '#1F7A55', bg: 'rgba(31,122,85,0.10)' },
  paused:         { label: 'Paused',      color: '#8A8A92', bg: 'rgba(22,22,26,0.06)' },
}

const PLAN_LABELS: Record<string, string> = {
  basica: 'Starter', profesional: 'Pro', avanzada: 'Advanced',
}

const PLAN_BADGE: Record<string, { color: string; bg: string }> = {
  basica:      { color: '#8A8A92', bg: '#F2F0EB' },
  profesional: { color: '#FFFFFF', bg: '#16161A' },
  avanzada:    { color: '#D46FC8', bg: 'rgba(212,111,200,0.15)' },
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
      <TopBar title="Dashboard" />

      <div className="flex-1 p-6 space-y-6 max-w-5xl">

        {/* Status card skeleton */}
        {loading && (
          <div className="yele-card-quiet p-6 animate-pulse">
            <div className="h-5 w-48 rounded-lg mb-3" style={{ backgroundColor: '#EEEDE9' }} />
            <div className="h-4 w-32 rounded-lg" style={{ backgroundColor: '#EEEDE9' }} />
          </div>
        )}

        {/* Status card */}
        {!loading && client && (
          <div className="yele-card-quiet p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2
                  className="text-xl font-semibold mb-1"
                  style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}
                >
                  {client.business_name}
                </h2>
                {client.city && (
                  <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>{client.city}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {client.plan && PLAN_BADGE[client.plan] && (
                  <span
                    className="yele-pill"
                    style={{ backgroundColor: PLAN_BADGE[client.plan].bg, color: PLAN_BADGE[client.plan].color }}
                  >
                    {PLAN_LABELS[client.plan] ?? client.plan}
                  </span>
                )}
                {statusConfig && (
                  <span
                    className="yele-pill"
                    style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
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
          <div className="yele-card-quiet p-6">
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
              We couldn&apos;t find your client profile. Get in touch with the Yele team.
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h3 className="yele-eyebrow mb-3">Quick actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/negocio',   icon: Building2,     title: 'Edit details',   desc: 'Hours, phone, description' },
              { href: '/contenido', icon: Layers,        title: 'Manage content', desc: 'Menu, showcase, testimonials…' },
              { href: '/mensajes',  icon: MessageSquare, title: 'Messages',       desc: 'Talk to the team' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="yele-card p-5 flex items-start gap-4 transition-transform hover:-translate-y-0.5"
                >
                  <div
                    className="mt-0.5 rounded-xl p-2 flex-shrink-0"
                    style={{ backgroundColor: 'rgba(212,111,200,0.12)' }}
                  >
                    <Icon size={16} style={{ color: '#D46FC8' }} />
                  </div>
                  <div>
                    <div
                      className="font-medium text-sm mb-0.5"
                      style={{ fontFamily: 'var(--font-instrument)', color: '#16161A' }}
                    >
                      {action.title}
                    </div>
                    <div className="text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
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
          <div className="yele-card-quiet p-6">
            <h3 className="yele-eyebrow mb-4">Your website</h3>

            {client.status === 'live' && client.website_url ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: '#8A8A92' }}>
                  {client.website_url}
                </span>
                <a
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yele-btn yele-btn-primary"
                >
                  View site <ExternalLink size={14} />
                </a>
              </div>
            ) : (
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                Your site is in progress.{' '}
                <span style={{ color: '#16161A' }}>We&apos;ll let you know when it&apos;s live.</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
