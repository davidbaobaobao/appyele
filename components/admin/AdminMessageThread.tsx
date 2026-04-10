'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Send } from 'lucide-react'

interface Message {
  id: string
  client_id: string
  author_role: 'client' | 'studio'
  body: string
  read: boolean
  created_at: string
}

interface Props {
  clientId: string
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

export default function AdminMessageThread({ clientId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
    if (error) console.error('admin messages fetch:', error)
    setMessages(data ?? [])
    setLoading(false)
  }, [clientId])

  // Mark client messages as read when thread is viewed
  const markClientRead = useCallback(async () => {
    await supabaseAdmin
      .from('messages')
      .update({ read: true })
      .eq('client_id', clientId)
      .eq('author_role', 'client')
      .eq('read', false)
  }, [clientId])

  useEffect(() => {
    fetchMessages()
    markClientRead()
  }, [fetchMessages, markClientRead])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll every 15s
  useEffect(() => {
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const body = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const { error } = await supabaseAdmin
      .from('messages')
      .insert({ client_id: clientId, author_role: 'studio', body, read: false })

    if (error) {
      console.error('admin send error:', error)
    } else {
      // Mark all client messages as read after studio replies
      await supabaseAdmin
        .from('messages')
        .update({ read: true })
        .eq('client_id', clientId)
        .eq('author_role', 'client')
        .eq('read', false)
      await fetchMessages()
    }
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
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const groups = groupByDate(messages)

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        backgroundColor: '#1E2B3A',
        border: '1px solid rgba(45,63,82,0.4)',
        height: '600px',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(45,63,82,0.4)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: '#F5F2EE' }}>Mensajes</h3>
        <span className="text-xs" style={{ color: '#8A9BAD' }}>{messages.length} mensajes</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="h-10 rounded-2xl" style={{ width: `${120 + i * 30}px`, backgroundColor: '#2D3F52' }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12 text-center">
            <p className="text-sm" style={{ color: '#8A9BAD' }}>Sin mensajes todavía</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Date separator */}
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(45,63,82,0.4)' }} />
                <span className="text-xs" style={{ color: '#8A9BAD' }}>{formatDate(group.date)}</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(45,63,82,0.4)' }} />
              </div>

              {group.messages.map((msg) => {
                const isClient = msg.author_role === 'client'
                return (
                  <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <div style={{ maxWidth: '75%' }}>
                      {/* Role label */}
                      <div
                        className={`text-xs mb-0.5 ${isClient ? 'text-right' : 'text-left'}`}
                        style={{ color: '#8A9BAD' }}
                      >
                        {isClient ? 'Cliente' : 'Estudio'}
                      </div>
                      <div
                        className="px-3 py-2 text-sm leading-relaxed"
                        style={{
                          backgroundColor: isClient ? '#E8A020' : '#2D3F52',
                          color: isClient ? '#0F1923' : '#F5F2EE',
                          borderRadius: isClient ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                        }}
                      >
                        {msg.body}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${isClient ? 'text-right' : 'text-left'}`}
                        style={{ color: '#8A9BAD' }}
                      >
                        {formatTime(msg.created_at)}
                        {isClient && !msg.read && (
                          <span className="ml-1" style={{ color: '#E8A020' }}>● no leído</span>
                        )}
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

      {/* Reply input */}
      <div
        className="px-4 py-3 flex-shrink-0 flex items-end gap-2"
        style={{ borderTop: '1px solid rgba(45,63,82,0.4)' }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Responder al cliente… (Enter para enviar)"
          rows={1}
          className="flex-1 resize-none rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
          style={{
            backgroundColor: '#0F1923',
            border: '1px solid rgba(45,63,82,0.6)',
            color: '#F5F2EE',
            maxHeight: '120px',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(45,63,82,0.6)' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#E8A020', color: '#0F1923' }}
          onMouseEnter={(e) => { if (input.trim()) e.currentTarget.style.backgroundColor = '#B87A10' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E8A020' }}
        >
          <Send size={13} />
          {sending ? 'Enviando…' : 'Responder'}
        </button>
      </div>
    </div>
  )
}
