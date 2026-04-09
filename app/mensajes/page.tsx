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
  const [clientId, setClientId]   = useState<string | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [loading, setLoading]     = useState(true)
  const [clientError, setClientError] = useState(false)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async (cid: string) => {
    console.log('[mensajes] fetchMessages called with client_id:', cid)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', cid)
      .order('created_at', { ascending: true })
    console.log('[mensajes] messages result:', { count: data?.length, error })
    if (error) console.error('[mensajes] messages fetch error:', error)
    setMessages(data ?? [])
  }, [])

  const markStudioRead = useCallback(async (cid: string) => {
    console.log('[mensajes] marking studio messages read for client_id:', cid)
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('client_id', cid)
      .eq('author_role', 'studio')
      .eq('read', false)
    if (error) console.error('[mensajes] markStudioRead error:', error)
  }, [])

  useEffect(() => {
    async function init() {
      console.log('[mensajes] init: getting auth user…')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('[mensajes] auth user:', { id: user?.id, email: user?.email, error: userError })

      if (!user) {
        console.warn('[mensajes] no auth user found — not logged in?')
        setLoading(false)
        return
      }

      console.log('[mensajes] fetching client row for user_id:', user.id)
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, business_name')
        .eq('user_id', user.id)
        .single()

      console.log('[mensajes] client row result:', { client, error: clientError })

      if (clientError) {
        console.error('[mensajes] client fetch error (no row found for this user?):', clientError)
        setClientError(true)
        setLoading(false)
        return
      }

      if (client) {
        console.log('[mensajes] client.id (used as client_id for messages):', client.id)
        setClientId(client.id)
        await fetchMessages(client.id)
        await markStudioRead(client.id)
      }
      setLoading(false)
    }
    init()
  }, [fetchMessages, markStudioRead])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll every 15s
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const payload = { client_id: clientId, author_role: 'client', body, read: false }
    console.log('[mensajes] inserting message:', payload)

    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select()

    console.log('[mensajes] insert result:', { data, error })
    if (error) console.error('[mensajes] send error:', error)
    else await fetchMessages(clientId)
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  const groups = groupByDate(messages)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0F1923' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col" style={{ marginLeft: '220px', height: '100vh' }}>
        <TopBar title="Mensajes" />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {clientError ? (
            <div className="py-20 text-center">
              <p className="text-sm" style={{ color: '#C43A2A' }}>
                No se encontró tu perfil de cliente.
                Comprueba la consola del navegador para más detalles.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="h-10 rounded-2xl" style={{ width: `${140 + i * 40}px`, backgroundColor: '#1E2B3A' }} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm" style={{ color: '#8A9BAD' }}>Aún no hay mensajes. ¡Envía el primero!</p>
              </div>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(45,63,82,0.4)' }} />
                  <span className="text-xs" style={{ color: '#8A9BAD' }}>{formatDate(group.date)}</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(45,63,82,0.4)' }} />
                </div>

                {group.messages.map((msg) => {
                  const isClient = msg.author_role === 'client'
                  return (
                    <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                      <div style={{ maxWidth: '70%' }}>
                        <div
                          className="px-4 py-2.5 text-sm leading-relaxed"
                          style={{
                            backgroundColor: isClient ? '#E8A020' : '#2D3F52',
                            color: isClient ? '#0F1923' : '#F5F2EE',
                            borderRadius: isClient ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          }}
                        >
                          {msg.body}
                        </div>
                        <div
                          className={`text-xs mt-1 ${isClient ? 'text-right' : 'text-left'}`}
                          style={{ color: '#8A9BAD' }}
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
          style={{ borderTop: '1px solid rgba(45,63,82,0.3)', backgroundColor: '#0F1923' }}
        >
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje… (Enter para enviar)"
              rows={1}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: '#1E2B3A',
                border: '1px solid rgba(45,63,82,0.6)',
                color: '#F5F2EE',
                maxHeight: '100px',
              }}
              onFocus={(e)  => { e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)' }}
              onBlur={(e)   => { e.currentTarget.style.borderColor = 'rgba(45,63,82,0.6)' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#E8A020' }}
              onMouseEnter={(e) => { if (input.trim()) e.currentTarget.style.backgroundColor = '#B87A10' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E8A020' }}
            >
              <Send size={16} style={{ color: '#0F1923' }} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
