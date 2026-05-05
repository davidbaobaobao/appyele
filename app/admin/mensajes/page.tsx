'use client'

import { useEffect, useState, useMemo } from 'react'
import { Mail, MailOpen, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface Message {
  id: string
  client_id: string
  author_role?: string
  name?: string
  email?: string
  body?: string
  message?: string
  read: boolean
  created_at: string
  clients?: {
    name: string
    website_url?: string
  }
}

function formatDateTime(d: string) {
  const date = new Date(d)
  const now   = new Date()
  const diff  = now.getTime() - date.getTime()
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' hoy'
  }
  return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isNew(d: string) {
  return Date.now() - new Date(d).getTime() < 24 * 60 * 60 * 1000
}

const inputStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.08)',
  color: '#1D1D1F',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer' as const,
  fontFamily: 'var(--font-instrument)',
}

export default function MensajesPage() {
  const [messages, setMessages]         = useState<Message[]>([])
  const [loading, setLoading]           = useState(true)
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [expanded, setExpanded]         = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/all-messages')
      .then((r) => r.json())
      .then((data) => { setMessages(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const unreadCount = useMemo(() => messages.filter((m) => !m.read).length, [messages])

  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>()
    messages.forEach((m) => {
      if (m.client_id && m.clients?.name) seen.set(m.client_id, m.clients.name)
    })
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [messages])

  const filtered = useMemo(() => {
    return messages.filter((m) => clientFilter === 'all' || m.client_id === clientFilter)
  }, [messages, clientFilter])

  async function markRead(id: string) {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m))
    await fetch('/api/admin/all-messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl font-semibold flex items-center gap-3"
            style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}
          >
            Mensajes
            {unreadCount > 0 && (
              <span
                className="text-sm font-semibold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
              >
                {unreadCount} sin leer
              </span>
            )}
          </h1>
          {!loading && (
            <p className="text-sm mt-1" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>
              {filtered.length} mensaje{filtered.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">Todos los clientes</option>
          {clientOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: '#F5F5F7' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="py-16 text-center rounded-2xl"
          style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <p className="text-sm" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>No hay mensajes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => {
            const senderName  = msg.name ?? (msg.author_role ?? '—')
            const senderEmail = msg.email ?? ''
            const body        = msg.body ?? msg.message ?? ''
            const isExpanded  = expanded.has(msg.id)
            const clientName  = msg.clients?.name ?? '—'

            return (
              <div
                key={msg.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${msg.read ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.12)'}`,
                }}
              >
                {/* Summary row */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => toggleExpand(msg.id)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {msg.read
                      ? <MailOpen size={16} style={{ color: '#86868B' }} />
                      : <Mail     size={16} style={{ color: '#1D1D1F' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Client badge */}
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#F5F5F7', color: '#86868B', fontFamily: 'var(--font-instrument)' }}
                      >
                        {clientName}
                      </span>
                      {isNew(msg.created_at) && !msg.read && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
                        >
                          Nuevo
                        </span>
                      )}
                      <span className="text-sm font-medium" style={{ color: '#1D1D1F', fontFamily: 'var(--font-instrument)' }}>{senderName}</span>
                      {senderEmail && (
                        <span className="text-xs" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>{senderEmail}</span>
                      )}
                    </div>
                    <p
                      className="text-sm mt-1"
                      style={{
                        color: '#86868B',
                        fontFamily: 'var(--font-instrument)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: isExpanded ? 'normal' : 'nowrap',
                      }}
                    >
                      {isExpanded ? body : body.slice(0, 100) + (body.length > 100 ? '…' : '')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-auto pl-2">
                    <span className="text-xs font-mono" style={{ color: '#86868B' }}>{formatDateTime(msg.created_at)}</span>
                    {isExpanded ? <ChevronUp size={14} style={{ color: '#86868B' }} /> : <ChevronDown size={14} style={{ color: '#86868B' }} />}
                  </div>
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4 flex items-center gap-3 flex-wrap"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="pt-3 flex items-center gap-3 flex-wrap w-full">
                      {senderEmail && (
                        <a
                          href={`mailto:${senderEmail}?subject=Re: Mensaje desde ${clientName}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{
                            backgroundColor: 'transparent',
                            color: '#1D1D1F',
                            border: '1px solid rgba(0,0,0,0.08)',
                            fontFamily: 'var(--font-instrument)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          <Mail size={12} /> Responder
                        </a>
                      )}
                      {msg.clients?.website_url && (
                        <a
                          href={msg.clients.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{
                            backgroundColor: 'transparent',
                            color: '#86868B',
                            border: '1px solid rgba(0,0,0,0.08)',
                            fontFamily: 'var(--font-instrument)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7'; e.currentTarget.style.color = '#1D1D1F' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#86868B' }}
                        >
                          <ExternalLink size={12} /> Ver web del cliente
                        </a>
                      )}
                      {!msg.read && (
                        <button
                          onClick={() => markRead(msg.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-auto"
                          style={{
                            backgroundColor: 'rgba(6,95,70,0.06)',
                            color: '#065f46',
                            border: '1px solid rgba(6,95,70,0.15)',
                            fontFamily: 'var(--font-instrument)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(6,95,70,0.12)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(6,95,70,0.06)' }}
                        >
                          <MailOpen size={12} /> Marcar como leído
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
