'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Send } from 'lucide-react'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'

interface Message {
  id: string
  client_id: string
  author_role: 'client' | 'studio'
  body: string
  read: boolean
  created_at: string
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = []
  let currentDate = ''
  for (const msg of messages) {
    const d = new Date(msg.created_at).toDateString()
    if (d !== currentDate) {
      currentDate = d
      groups.push({ date: msg.created_at, messages: [msg] })
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  }
  return groups
}

export default function MensajesPage() {
  const [clientId, setClientId]       = useState<string | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [loading, setLoading]         = useState(true)
  const [clientError, setClientError] = useState(false)
  const [input, setInput]             = useState('')
  const [sending, setSending]         = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async (cid: string) => {
    const { data, error } = await supabase
      .from('messages').select('*').eq('client_id', cid).order('created_at', { ascending: true })
    if (error) console.error('[mensajes] messages fetch error:', error)
    setMessages(data ?? [])
  }, [])

  const markStudioRead = useCallback(async (cid: string) => {
    await supabase.from('messages').update({ read: true })
      .eq('client_id', cid).eq('author_role', 'studio').eq('read', false)
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: client, error: clientErr } = await supabase
        .from('clients').select('id, business_name').eq('user_id', user.id).single()

      if (clientErr) { setClientError(true); setLoading(false); return }

      if (client) {
        setClientId(client.id)
        await fetchMessages(client.id)
        await markStudioRead(client.id)
      }
      setLoading(false)
    }
    init()
  }, [fetchMessages, markStudioRead])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!clientId) return
    const interval = setInterval(() => fetchMessages(clientId), 15000)
    return () => clearInterval(interval)
  }, [clientId, fetchMessages])

  const handleSend = async () => {
    if (!input.trim() || !clientId || sending) return
    setSending(true)
    const body = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const { error } = await supabase
      .from('messages').insert({ client_id: clientId, author_role: 'client', body, read: false }).select()

    if (error) console.error('[mensajes] send error:', error)
    else await fetchMessages(clientId)
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  const groups = groupByDate(messages)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main" style={{ height: '100vh' }}>
        <TopBar title="Mensajes" />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {clientError ? (
            <div className="py-20 text-center">
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#991b1b' }}>
                No se encontró tu perfil de cliente.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="h-10 rounded-2xl" style={{ width: `${140 + i * 40}px`, backgroundColor: '#F5F5F7' }} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                  Aún no hay mensajes. ¡Envía el primero!
                </p>
              </div>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                  <span className="text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                    {formatDate(group.date)}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                </div>

                {group.messages.map((msg) => {
                  const isClient = msg.author_role === 'client'
                  return (
                    <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                      <div style={{ maxWidth: '70%' }}>
                        <div
                          className="px-4 py-2.5 text-sm leading-relaxed"
                          style={{
                            backgroundColor: isClient ? '#1D1D1F' : '#F5F5F7',
                            color: isClient ? '#FFFFFF' : '#1D1D1F',
                            borderRadius: isClient ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            fontFamily: 'var(--font-instrument)',
                          }}
                        >
                          {msg.body}
                        </div>
                        <div
                          className={`text-xs mt-1 ${isClient ? 'text-right' : 'text-left'}`}
                          style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
                        >
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          className="px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF' }}
        >
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje… (Enter para enviar)"
              rows={1}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                backgroundColor: '#F5F5F7',
                border: '1px solid rgba(0,0,0,0.08)',
                color: '#1D1D1F',
                maxHeight: '100px',
                fontFamily: 'var(--font-instrument)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1D1D1F' }}
              onMouseEnter={(e) => { if (input.trim()) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <Send size={16} style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
