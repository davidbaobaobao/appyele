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
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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
  const [sendError, setSendError]     = useState(false)
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
    setSendError(false)
    const body = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error('send failed')
      await fetchMessages(clientId)
    } catch {
      setSendError(true)
      // Restore the unsent message so user can try again
      setInput(body)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px'
      }
    }
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
        <TopBar title="Messages" />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {clientError ? (
            <div className="py-20 text-center">
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#B3382B' }}>
                We couldn&apos;t find your client profile.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="h-10 rounded-2xl" style={{ width: `${140 + i * 40}px`, backgroundColor: '#F2F0EB' }} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-3xl mb-3">💬</div>
                <p className="yele-eyebrow mb-2">No messages yet</p>
                <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                  Send the first one and we&apos;ll reply here.
                </p>
              </div>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 yele-rule" />
                  <span className="yele-eyebrow">{formatDate(group.date)}</span>
                  <div className="flex-1 yele-rule" />
                </div>

                {group.messages.map((msg) => {
                  const isClient = msg.author_role === 'client'
                  return (
                    <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                      <div style={{ maxWidth: '70%' }}>
                        <div
                          className="px-4 py-2.5 text-sm leading-relaxed"
                          style={{
                            backgroundColor: isClient ? '#16161A' : '#F2F0EB',
                            color: isClient ? '#FFFFFF' : '#16161A',
                            borderRadius: isClient ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            fontFamily: 'var(--font-instrument)',
                          }}
                        >
                          {msg.body}
                        </div>
                        <div
                          className={`text-xs mt-1 ${isClient ? 'text-right' : 'text-left'}`}
                          style={{ fontFamily: 'var(--font-mono)', color: '#8A8A92' }}
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

        {/* Send error banner */}
        {sendError && (
          <div
            className="mx-6 mb-2 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
            style={{ backgroundColor: 'rgba(179,56,43,0.09)', border: '1px solid rgba(179,56,43,0.18)', fontFamily: 'var(--font-instrument)' }}
          >
            <span style={{ color: '#B3382B', flexShrink: 0 }}>⚠</span>
            <span style={{ color: '#B3382B' }}>
              Chat isn&apos;t available right now. Reach us on{' '}
              <a href="https://wa.me/8615021336924" style={{ color: '#B3382B', textDecoration: 'underline' }}>WhatsApp</a>
              {' '}or{' '}
              <a href="mailto:info@yele.design" style={{ color: '#B3382B', textDecoration: 'underline' }}>info@yele.design</a>.
            </span>
            <button
              onClick={() => setSendError(false)}
              style={{ marginLeft: 'auto', flexShrink: 0, color: '#B3382B', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
              aria-label="Dismiss"
            >×</button>
          </div>
        )}

        {/* Input area */}
        <div
          className="px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(22,22,26,0.08)', backgroundColor: '#FFFFFF' }}
        >
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a message… (Enter to send)"
              rows={1}
              className="yele-textarea flex-1 resize-none"
              style={{ maxHeight: '100px', borderRadius: '18px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="yele-btn yele-btn-primary flex-shrink-0"
              style={{ width: '40px', height: '40px', padding: 0 }}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
