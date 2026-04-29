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
  intake_pending: { label: 'En revisión',     color: '#E8A020', bg: 'rgba(232,160,32,0.12)' },
  building:       { label: 'En construcción', color: '#6BA8D4', bg: 'rgba(107,168,212,0.12)' },
  live:           { label: 'Activo',           color: '#2A8A5A', bg: 'rgba(42,138,90,0.12)' },
  paused:         { label: 'Pausado',          color: '#8A9BAD', bg: 'rgba(138,155,173,0.12)' },
  cancelled:      { label: 'Cancelado',        color: '#C43A2A', bg: 'rgba(196,58,42,0.12)' },
}

const PLAN_LABELS: Record<string, string> = {
  basica: 'Básica', profesional: 'Profesional', avanzada: 'Avanzada',
}

const PLAN_COLORS: Record<string, { color: string; bg: string }> = {
  basica:       { color: '#8A9BAD', bg: 'rgba(138,155,173,0.12)' },
  profesional:  { color: '#E8A020', bg: 'rgba(232,160,32,0.12)' },
  avanzada:     { color: '#E05A2B', bg: 'rgba(224,90,43,0.12)' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

const inputStyle = {
  backgroundColor: '#1E2B3A',
  border: '1px solid rgba(45,63,82,0.6)',
  color: '#F5F2EE',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
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
        <h1 className="text-2xl" style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}>
          Clientes
        </h1>
        {!loading && (
          <p className="text-sm mt-1" style={{ color: '#8A9BAD' }}>
            {filtered.length} de {clients.length} clientes
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A9BAD' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar negocio, ciudad o sector…"
            style={{ ...inputStyle, paddingLeft: '32px', width: '260px' }}
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="all">Todos los planes</option>
          <option value="basica">Básica</option>
          <option value="profesional">Profesional</option>
          <option value="avanzada">Avanzada</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="all">Todos los estados</option>
          <option value="intake_pending">En revisión</option>
          <option value="building">En construcción</option>
          <option value="live">Activo</option>
          <option value="paused">Pausado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}>
        {loading ? (
          <div className="space-y-px">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-14 animate-pulse" style={{ backgroundColor: i%2===0 ? '#1a2736' : '#1E2B3A' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: '#8A9BAD' }}>No se encontraron clientes</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(45,63,82,0.4)' }}>
                {['Negocio', 'Ciudad', 'Sector', 'Plan', 'Estado', 'Web', 'Msgs', 'Alta', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A9BAD' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const sc  = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.intake_pending
                const pc  = PLAN_COLORS[client.plan]
                return (
                  <tr
                    key={client.id}
                    onClick={() => goTo(client.id)}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(45,63,82,0.2)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: '#F5F2EE' }}>
                      {client.business_name ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#8A9BAD' }}>{client.city ?? '—'}</td>
                    <td className="px-4 py-3 max-w-[140px]" style={{ color: '#8A9BAD' }}>
                      {client.industry_type
                        ? client.industry_type.length > 18 ? client.industry_type.slice(0,18)+'…' : client.industry_type
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {client.plan && pc ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: pc.bg, color: pc.color }}>
                          {PLAN_LABELS[client.plan] ?? client.plan}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {client.website_url ? (
                        <a
                          href={client.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: '#E8A020' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#B87A10' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#E8A020' }}
                        >
                          <ExternalLink size={11} /> Ver web
                        </a>
                      ) : <span style={{ color: '#8A9BAD' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {(client.unread_count ?? 0) > 0 ? (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full inline-block" style={{ backgroundColor: '#C43A2A', color: '#fff' }}>
                          {client.unread_count}
                        </span>
                      ) : <span style={{ color: '#8A9BAD' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#8A9BAD' }}>
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); goTo(client.id) }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#F5F2EE', border: '1px solid rgba(255,255,255,0.1)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
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
