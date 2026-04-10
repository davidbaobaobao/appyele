'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, ExternalLink, Check } from 'lucide-react'
import AdminMessageThread from '@/components/admin/AdminMessageThread'

type ClientStatus = 'intake_pending' | 'building' | 'live' | 'paused' | 'cancelled'

interface Client {
  id: string
  business_name: string
  city: string
  industry_type: string
  plan: string
  status: ClientStatus
  phone: string
  email: string
  address: string
  description: string
  opening_hours: Record<string, string> | null
  dynamic_sections: string[]
  whatsapp_number: string
  preferred_contact: string
  website_url: string
  created_at: string
}

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'intake_pending', label: 'En revisión' },
  { value: 'building',       label: 'En construcción' },
  { value: 'live',           label: 'Activo' },
  { value: 'paused',         label: 'Pausado' },
  { value: 'cancelled',      label: 'Cancelado' },
]

const STATUS_CONFIG: Record<ClientStatus, { color: string; bg: string }> = {
  intake_pending: { color: '#E8A020', bg: 'rgba(232,160,32,0.12)' },
  building:       { color: '#6BA8D4', bg: 'rgba(107,168,212,0.12)' },
  live:           { color: '#2A8A5A', bg: 'rgba(42,138,90,0.12)' },
  paused:         { color: '#8A9BAD', bg: 'rgba(138,155,173,0.12)' },
  cancelled:      { color: '#C43A2A', bg: 'rgba(196,58,42,0.12)' },
}

const PLAN_LABELS: Record<string, string> = {
  basica: 'Básica', profesional: 'Profesional', avanzada: 'Avanzada',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

type ToastType = 'success' | 'error'

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<ClientStatus>('intake_pending')
  const [savingStatus, setSavingStatus] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/clients/${clientId}`)
      if (!res.ok) {
        console.error('client detail fetch:', res.status, await res.text())
        setLoading(false)
        return
      }
      const data = await res.json()
      setClient(data)
      setStatus(data.status)
      setLoading(false)
    }
    load()
  }, [clientId])

  const handleStatusChange = async (newStatus: ClientStatus) => {
    setStatus(newStatus)
    setSavingStatus(true)
    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setSavingStatus(false)
    if (!res.ok) {
      console.error('status update error:', res.status, await res.text())
      showToast('Error al actualizar el estado', 'error')
    } else {
      setClient((prev) => prev ? { ...prev, status: newStatus } : prev)
      showToast('Estado actualizado')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: '#8A9BAD',
    marginBottom: '4px',
  }

  const valueStyle = { fontSize: '14px', color: '#F5F2EE' }

  const sc = client ? (STATUS_CONFIG[status] ?? STATUS_CONFIG.intake_pending) : null

  return (
    <div className="flex-1 p-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: '#8A9BAD' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#F5F2EE' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#8A9BAD' }}
      >
        <ArrowLeft size={15} />
        Volver a clientes
      </button>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl h-96" style={{ backgroundColor: '#1E2B3A' }} />
          ))}
        </div>
      ) : !client ? (
        <p className="text-sm" style={{ color: '#C43A2A' }}>Cliente no encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Identificación */}
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}
                  >
                    {client.business_name}
                  </h2>
                  <p className="text-xs mt-1 font-mono" style={{ color: '#8A9BAD' }}>{client.id}</p>
                </div>
                {client.plan && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'rgba(232,160,32,0.12)', color: '#E8A020' }}
                  >
                    {PLAN_LABELS[client.plan] ?? client.plan}
                  </span>
                )}
              </div>

              {/* Status selector */}
              <div>
                <label style={labelStyle}>Estado</label>
                <div className="flex items-center gap-2">
                  {sc && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.color }}
                    >
                      {STATUS_OPTIONS.find((o) => o.value === status)?.label}
                    </span>
                  )}
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
                    disabled={savingStatus}
                    className="text-xs rounded-lg px-2 py-1.5 outline-none disabled:opacity-60"
                    style={{
                      backgroundColor: '#0F1923',
                      border: '1px solid rgba(45,63,82,0.6)',
                      color: '#F5F2EE',
                      cursor: 'pointer',
                    }}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {savingStatus && <span className="text-xs" style={{ color: '#8A9BAD' }}>Guardando…</span>}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: 'rgba(45,63,82,0.4)' }} />

              {/* Contact fields */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Ciudad',    value: client.city },
                  { label: 'Sector',    value: client.industry_type },
                  { label: 'Teléfono', value: client.phone },
                  { label: 'Email',     value: client.email },
                  { label: 'Dirección', value: client.address },
                  { label: 'Contacto preferido', value: client.preferred_contact },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <label style={labelStyle}>{label}</label>
                    <p style={valueStyle}>{value}</p>
                  </div>
                ) : null)}
              </div>

              {client.whatsapp_number && (
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <p style={valueStyle}>{client.whatsapp_number}</p>
                </div>
              )}

              {client.website_url && (
                <div>
                  <label style={labelStyle}>Web actual</label>
                  <a
                    href={client.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm transition-colors"
                    style={{ color: '#E8A020' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#B87A10' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#E8A020' }}
                  >
                    {client.website_url} <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div>
                <label style={labelStyle}>Miembro desde</label>
                <p style={valueStyle}>{formatDate(client.created_at)}</p>
              </div>
            </div>

            {/* Descripción */}
            {(client.description || client.opening_hours) && (
              <div
                className="rounded-xl p-5 space-y-4"
                style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
              >
                <h3 className="text-sm font-semibold" style={{ color: '#F5F2EE' }}>Descripción</h3>

                {client.description && (
                  <p className="text-sm leading-relaxed" style={{ color: '#8A9BAD' }}>
                    {client.description}
                  </p>
                )}

                {client.opening_hours && Object.keys(client.opening_hours).length > 0 && (
                  <div>
                    <label style={labelStyle}>Horario</label>
                    <div className="space-y-1 mt-1">
                      {Object.entries(client.opening_hours).map(([key, val]) => (
                        <div key={key} className="flex gap-3 text-sm">
                          <span className="w-20 flex-shrink-0" style={{ color: '#8A9BAD' }}>
                            {DAY_LABELS[key] ?? key}
                          </span>
                          <span style={{ color: '#F5F2EE' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Secciones dinámicas */}
            {client.dynamic_sections?.length > 0 && (
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#F5F2EE' }}>
                  Secciones dinámicas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {client.dynamic_sections.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-mono px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: 'rgba(45,63,82,0.6)', color: '#8A9BAD' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones rápidas */}
            <div
              className="rounded-xl p-5 space-y-3"
              style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: '#F5F2EE' }}>Acciones rápidas</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => copyToClipboard(client.id, 'uuid')}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F2EE' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                >
                  {copied === 'uuid' ? <Check size={14} style={{ color: '#2A8A5A' }} /> : <Copy size={14} style={{ color: '#8A9BAD' }} />}
                  {copied === 'uuid' ? 'UUID copiado' : 'Copiar UUID'}
                </button>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(client, null, 2), 'json')}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F2EE' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                >
                  {copied === 'json' ? <Check size={14} style={{ color: '#2A8A5A' }} /> : <Copy size={14} style={{ color: '#8A9BAD' }} />}
                  {copied === 'json' ? 'JSON copiado' : 'Copiar datos JSON'}
                </button>

                <a
                  href="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F2EE' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                >
                  <ExternalLink size={14} style={{ color: '#8A9BAD' }} />
                  Ver dashboard del cliente
                </a>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — Messages ── */}
          <div>
            <AdminMessageThread clientId={clientId} />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg z-50"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgba(42,138,90,0.15)' : 'rgba(196,58,42,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(42,138,90,0.4)' : 'rgba(196,58,42,0.4)'}`,
            color: toast.type === 'success' ? '#2A8A5A' : '#C43A2A',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
