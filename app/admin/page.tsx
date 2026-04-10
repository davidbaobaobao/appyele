'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Search } from 'lucide-react'

type ClientStatus = 'intake_pending' | 'building' | 'live' | 'paused' | 'cancelled'

interface Client {
  id: string
  business_name: string
  city: string
  industry_type: string
  plan: string
  status: ClientStatus
  created_at: string
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export default function AdminPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      // Fetch all clients sorted by newest first
      const { data: clientRows, error } = await supabaseAdmin
        .from('clients')
        .select('id, business_name, city, industry_type, plan, status, created_at')
        .order('created_at', { ascending: false })

      if (error) { console.error('admin clients fetch:', error); setLoading(false); return }

      // Fetch unread counts (author_role = 'client', read = false) per client
      const { data: unreadRows } = await supabaseAdmin
        .from('messages')
        .select('client_id')
        .eq('author_role', 'client')
        .eq('read', false)

      const unreadMap: Record<string, number> = {}
      for (const row of unreadRows ?? []) {
        unreadMap[row.client_id] = (unreadMap[row.client_id] ?? 0) + 1
      }

      setClients(
        (clientRows ?? []).map((c) => ({ ...c, unread_count: unreadMap[c.id] ?? 0 }))
      )
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        !search ||
        c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [clients, search, statusFilter])

  const inputStyle = {
    backgroundColor: '#1E2B3A',
    border: '1px solid rgba(45,63,82,0.6)',
    color: '#F5F2EE',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}>
            Clientes
          </h1>
          {!loading && (
            <p className="text-sm mt-1" style={{ color: '#8A9BAD' }}>
              {clients.length} clientes en total
            </p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A9BAD' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar negocio o ciudad…"
            style={{ ...inputStyle, paddingLeft: '32px', width: '240px' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(45,63,82,0.6)' }}
          />
        </div>
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
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
      >
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse" style={{ backgroundColor: i % 2 === 0 ? '#1a2736' : '#1E2B3A' }} />
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
                {['Negocio', 'Ciudad', 'Sector', 'Plan', 'Estado', 'Msgs', 'Fecha', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#8A9BAD' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const sc = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.intake_pending
                return (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/admin/${client.id}`)}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(45,63,82,0.2)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: '#F5F2EE' }}>
                      {client.business_name ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#8A9BAD' }}>
                      {client.city ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#8A9BAD' }}>
                      {client.industry_type
                        ? client.industry_type.length > 20
                          ? client.industry_type.slice(0, 20) + '…'
                          : client.industry_type
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {client.plan ? (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(232,160,32,0.12)', color: '#E8A020' }}
                        >
                          {PLAN_LABELS[client.plan] ?? client.plan}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                      >
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(client.unread_count ?? 0) > 0 ? (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center inline-block"
                          style={{ backgroundColor: '#C43A2A', color: '#fff' }}
                        >
                          {client.unread_count}
                        </span>
                      ) : (
                        <span style={{ color: '#8A9BAD' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#8A9BAD' }}>
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/${client.id}`) }}
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
