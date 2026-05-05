'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ExternalLink } from 'lucide-react'

type ClientStatus = 'intake_pending' | 'building' | 'live' | 'paused' | 'cancelled'

interface Client {
  id: string
  business_name: string
  city: string
  industry_type: string
  plan: string
  status: ClientStatus
  created_at: string
  website_url?: string
  unread_count?: number
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  intake_pending: { label: 'En revisión',     color: '#92400e', bg: 'rgba(180,120,40,0.1)'  },
  building:       { label: 'En construcción', color: '#1e40af', bg: 'rgba(30,64,175,0.08)'  },
  live:           { label: 'Activo',          color: '#065f46', bg: 'rgba(6,95,70,0.08)'    },
  paused:         { label: 'Pausado',         color: '#86868B', bg: 'rgba(0,0,0,0.06)'      },
  cancelled:      { label: 'Cancelado',       color: '#991b1b', bg: 'rgba(153,27,27,0.08)'  },
}

const PLAN_LABELS: Record<string, string> = {
  basica: 'Básica', profesional: 'Profesional', avanzada: 'Avanzada',
}

const PLAN_BADGE: Record<string, { color: string; bg: string }> = {
  basica:      { color: '#86868B', bg: '#F5F5F7' },
  profesional: { color: '#FFFFFF', bg: '#1D1D1F' },
  avanzada:    { color: '#C8A97E', bg: 'rgba(200,169,126,0.15)' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.08)',
  color: '#1D1D1F',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'var(--font-instrument)',
}

export default function ClientesPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/clients')
      if (!res.ok) { setLoading(false); return }
      setClients(await res.json())
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch = !search
        || c.business_name?.toLowerCase().includes(q)
        || c.city?.toLowerCase().includes(q)
        || c.industry_type?.toLowerCase().includes(q)
      const matchPlan   = planFilter === 'all'   || c.plan   === planFilter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchPlan && matchStatus
    })
  }, [clients, search, planFilter, statusFilter])

  function goTo(id: string) { router.push(`/admin/clientes/${id}`) }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
          Clientes
        </h1>
        {!loading && (
          <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
            {filtered.length} de {clients.length} clientes
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#86868B' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar negocio, ciudad o sector…"
            style={{ ...inputStyle, paddingLeft: '32px', width: '260px' }}
          />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">Todos los planes</option>
          <option value="basica">Básica</option>
          <option value="profesional">Profesional</option>
          <option value="avanzada">Avanzada</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">Todos los estados</option>
          <option value="intake_pending">En revisión</option>
          <option value="building">En construcción</option>
          <option value="live">Activo</option>
          <option value="paused">Pausado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}
      >
        {loading ? (
          <div className="space-y-px">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-14 animate-pulse" style={{ backgroundColor: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>No se encontraron clientes</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {['Negocio', 'Ciudad', 'Sector', 'Plan', 'Estado', 'Web', 'Msgs', 'Alta', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const sc = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.intake_pending
                const pb = PLAN_BADGE[client.plan]
                return (
                  <tr
                    key={client.id}
                    onClick={() => goTo(client.id)}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td className="px-4 py-4 font-medium" style={{ fontFamily: 'var(--font-instrument)', color: '#1D1D1F' }}>
                      {client.business_name ?? '—'}
                    </td>
                    <td className="px-4 py-4" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                      {client.city ?? '—'}
                    </td>
                    <td className="px-4 py-4 max-w-[140px]" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                      {client.industry_type
                        ? client.industry_type.length > 18 ? client.industry_type.slice(0, 18) + '…' : client.industry_type
                        : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {client.plan && pb ? (
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: pb.bg, color: pb.color, fontFamily: 'var(--font-instrument)' }}
                        >
                          {PLAN_LABELS[client.plan] ?? client.plan}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: sc.bg, color: sc.color, fontFamily: 'var(--font-instrument)' }}
                      >
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {client.website_url ? (
                        <a
                          href={client.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ fontFamily: 'var(--font-instrument)', color: '#C8A97E' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#92400e' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#C8A97E' }}
                        >
                          <ExternalLink size={11} /> Ver web
                        </a>
                      ) : <span style={{ color: '#86868B' }}>—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {(client.unread_count ?? 0) > 0 ? (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full inline-block"
                          style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
                        >
                          {client.unread_count}
                        </span>
                      ) : <span style={{ color: '#86868B' }}>—</span>}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs" style={{ color: '#86868B' }}>
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); goTo(client.id) }}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#86868B',
                          border: '1px solid rgba(0,0,0,0.08)',
                          fontFamily: 'var(--font-instrument)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7'; e.currentTarget.style.color = '#1D1D1F' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#86868B' }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
