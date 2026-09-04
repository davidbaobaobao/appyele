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
  intake_pending: { label: 'In review',   color: '#8A5A16', bg: 'rgba(138,90,22,0.10)' },
  building:       { label: 'In progress', color: '#2B4FA8', bg: 'rgba(43,79,168,0.09)' },
  live:           { label: 'Live',        color: '#1F7A55', bg: 'rgba(31,122,85,0.10)' },
  paused:         { label: 'Paused',      color: '#8A8A92', bg: 'rgba(22,22,26,0.06)'  },
  cancelled:      { label: 'Cancelled',   color: '#B3382B', bg: 'rgba(179,56,43,0.09)' },
}

const PLAN_LABELS: Record<string, string> = {
  basica: 'Starter', profesional: 'Pro', avanzada: 'Advanced',
}

const PLAN_BADGE: Record<string, { color: string; bg: string }> = {
  basica:      { color: '#8A8A92', bg: '#F2F0EB' },
  profesional: { color: '#FFFFFF', bg: '#16161A' },
  avanzada:    { color: '#D46FC8', bg: 'rgba(212,111,200,0.15)' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US')
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
        <span className="yele-eyebrow">Admin</span>
        <h1 className="text-3xl font-semibold mt-2" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
          Clients
        </h1>
        {!loading && (
          <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
            {filtered.length} of {clients.length} clients
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: '#8A8A92' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business, city or industry…"
            aria-label="Search clients"
            className="yele-input"
            style={{ paddingLeft: '34px', width: '260px' }}
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          aria-label="Filter by plan"
          className="yele-select"
          style={{ width: 'auto', cursor: 'pointer' }}
        >
          <option value="all">All plans</option>
          <option value="basica">Starter</option>
          <option value="profesional">Pro</option>
          <option value="avanzada">Advanced</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="yele-select"
          style={{ width: 'auto', cursor: 'pointer' }}
        >
          <option value="all">All statuses</option>
          <option value="intake_pending">In review</option>
          <option value="building">In progress</option>
          <option value="live">Live</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="yele-card yele-card-lg overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-14 animate-pulse" style={{ backgroundColor: i % 2 === 0 ? '#EEEDE9' : '#FFFFFF' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>No clients found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(22,22,26,0.06)' }}>
                {['Business', 'City', 'Industry', 'Plan', 'Status', 'Site', 'Msgs', 'Added', ''].map((h) => (
                  <th key={h} className="yele-eyebrow text-left px-4 py-3">
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
                    style={{ borderBottom: '1px solid rgba(22,22,26,0.04)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F2F0EB' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td className="px-4 py-4 font-medium" style={{ fontFamily: 'var(--font-instrument)', color: '#16161A' }}>
                      {client.business_name ?? '—'}
                    </td>
                    <td className="px-4 py-4" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                      {client.city ?? '—'}
                    </td>
                    <td className="px-4 py-4 max-w-[140px]" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                      {client.industry_type
                        ? client.industry_type.length > 18 ? client.industry_type.slice(0, 18) + '…' : client.industry_type
                        : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {client.plan && pb ? (
                        <span className="yele-pill" style={{ backgroundColor: pb.bg, color: pb.color }}>
                          {PLAN_LABELS[client.plan] ?? client.plan}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="yele-pill" style={{ backgroundColor: sc.bg, color: sc.color }}>
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
                          style={{ fontFamily: 'var(--font-instrument)', color: '#D46FC8' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#16161A' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#D46FC8' }}
                        >
                          <ExternalLink size={11} /> View site
                        </a>
                      ) : <span style={{ color: '#8A8A92' }}>—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {(client.unread_count ?? 0) > 0 ? (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full inline-block"
                          style={{ backgroundColor: '#16161A', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
                        >
                          {client.unread_count}
                        </span>
                      ) : <span style={{ color: '#8A8A92' }}>—</span>}
                    </td>
                    <td className="px-4 py-4 text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#8A8A92' }}>
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); goTo(client.id) }}
                        className="yele-btn yele-btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        View
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
