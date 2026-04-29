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
  backgroundColor: '#1E2B3A',
  border: '1px solid rgba(45,63,82,0.6)',
  color: '#F5F2EE',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer' as const,
}

export default function MensajesPage() {
  const [messages, setMessages]     = useState<Message[]>([])
  const [loading, setLoading]       = useState(true)
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())

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
          <h1 className="text-2xl" style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}>
            Mensajes {unreadCount > 0 && (
              <span className="ml-2 text-base font-normal px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#E05A2B', color: '#fff', fontFamily: 'inherit' }}>
                {unreadCount} sin leer
              </span>
            )}
          </h1>
          {!loading && (
            <p className="text-sm mt-1" style={{ color: '#8A9BAD' }}>
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
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: '#1E2B3A' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl" style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}>
          <p className="text-sm" style={{ color: '#8A9BAD' }}>No hay mensajes.</p>
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
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: '#1E2B3A',
                  border: `1px solid ${msg.read ? 'rgba(45,63,82,0.4)' : 'rgba(224,90,43,0.4)'}`,
                }}
              >
                {/* Summary row */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => toggleExpand(msg.id)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {msg.read
                      ? <MailOpen size={16} style={{ color: '#8A9BAD' }} />
                      : <Mail     size={16} style={{ color: '#E05A2B' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Client badge */}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(224,90,43,0.12)', color: '#E05A2B' }}>
                        {clientName}
                      </span>
                      {isNew(msg.created_at) && !msg.read && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E05A2B', color: '#fff' }}>
                          Nuevo
                        </span>
                      )}
                      <span className="text-sm font-medium" style={{ color: '#F5F2EE' }}>{senderName}</span>
                      {senderEmail && (
                        <span className="text-xs" style={{ color: '#8A9BAD' }}>{senderEmail}</span>
                      )}
                    </div>
                    <p
                      className="text-sm mt-1"
                      style={{
                        color: '#8A9BAD',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: isExpanded ? 'normal' : 'nowrap',
                      }}
                    >
                      {isExpanded ? body : body.slice(0, 100) + (body.length > 100 ? '…' : '')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-auto pl-2">
                    <span className="text-xs font-mono" style={{ color: '#8A9BAD' }}>{formatDateTime(msg.created_at)}</span>
                    {isExpanded ? <ChevronUp size={14} style={{ color: '#8A9BAD' }} /> : <ChevronDown size={14} style={{ color: '#8A9BAD' }} />}
                  </div>
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4 flex items-center gap-3 flex-wrap"
                    style={{ borderTop: '1px solid rgba(45,63,82,0.3)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="pt-3 flex items-center gap-3 flex-wrap w-full">
                      {senderEmail && (
                        <a
                          href={`mailto:${senderEmail}?subject=Re: Mensaje desde ${clientName}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ backgroundColor: 'rgba(224,90,43,0.12)', color: '#E05A2B', border: '1px solid rgba(224,90,43,0.3)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(224,90,43,0.2)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(224,90,43,0.12)' }}
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
                          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#F5F2EE', border: '1px solid rgba(255,255,255,0.1)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
                        >
                          <ExternalLink size={12} /> Ver web del cliente
                        </a>
                      )}
                      {!msg.read && (
                        <button
                          onClick={() => markRead(msg.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-auto"
                          style={{ backgroundColor: 'rgba(42,138,90,0.1)', color: '#2A8A5A', border: '1px solid rgba(42,138,90,0.3)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(42,138,90,0.2)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(42,138,90,0.1)' }}
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
