'use client'

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  client_id: string
  author_role: 'client' | 'studio'
  body: string
  read: boolean
  created_at: string
  clients?: {
    business_name: string
    website_url?: string
    email?: string
  }
}

interface Conversation {
  clientId: string
  clientName: string
  lastBody: string
  lastAuthorRole: string
  lastAt: string
  unreadCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatConvTime(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 24 * 60 * 60 * 1000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }
  return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
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

function buildConversations(messages: Message[]): Conversation[] {
  // messages come ordered descending — first occurrence per client is the latest
  const map = new Map<string, Conversation>()
  for (const msg of messages) {
    const existing = map.get(msg.client_id)
    if (!existing) {
      map.set(msg.client_id, {
        clientId: msg.client_id,
        clientName: msg.clients?.business_name ?? '—',
        lastBody: msg.body,
        lastAuthorRole: msg.author_role,
        lastAt: msg.created_at,
        unreadCount: msg.author_role === 'client' && !msg.read ? 1 : 0,
      })
    } else {
      if (msg.author_role === 'client' && !msg.read) existing.unreadCount++
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// ─── Thread panel ─────────────────────────────────────────────────────────────

function ThreadPanel({ clientId, clientName, onUnreadChange }: {
  clientId: string
  clientName: string
  onUnreadChange: (clientId: string, count: number) => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/admin/messages?clientId=${clientId}`)
    if (!res.ok) return
    const data: Message[] = await res.json()
    setMessages(data)
    setLoading(false)
  }, [clientId])

  const markRead = useCallback(async () => {
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    onUnreadChange(clientId, 0)
  }, [clientId, onUnreadChange])

  useEffect(() => {
    setMessages([])
    setLoading(true)
    fetchMessages()
    markRead()
  }, [clientId, fetchMessages, markRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

    const res = await fetch('/api/admin/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, body }),
    })
    if (res.ok) await fetchMessages()
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
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Thread header */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(22,22,26,0.07)', backgroundColor: '#FFFFFF' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
          style={{ backgroundColor: '#16161A', color: '#FFFFFF' }}
        >
          {initials(clientName)}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
            {clientName}
          </p>
          <p className="text-xs" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>
            {loading ? 'Loading…' : `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ backgroundColor: '#F7F6F3' }}>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="h-10 rounded-2xl" style={{ width: `${130 + i * 35}px`, backgroundColor: '#EEEDE9' }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>
              No messages yet
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(22,22,26,0.07)' }} />
                <span className="yele-eyebrow">
                  {formatDate(group.date)}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(22,22,26,0.07)' }} />
              </div>

              {group.messages.map((msg) => {
                const isClient = msg.author_role === 'client'
                return (
                  <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <div style={{ maxWidth: '72%' }}>
                      <div
                        className="px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          backgroundColor: isClient ? '#FFFFFF' : '#16161A',
                          color: isClient ? '#16161A' : '#F2F0EB',
                          borderRadius: isClient ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          fontFamily: 'var(--font-instrument)',
                          border: isClient ? '1px solid rgba(22,22,26,0.08)' : 'none',
                        }}
                      >
                        {msg.body}
                      </div>
                      <div
                        className={`text-xs mt-1 ${isClient ? 'text-right' : 'text-left'}`}
                        style={{ color: '#8A8A92', fontFamily: 'var(--font-mono)' }}
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

      {/* Reply input */}
      <div
        className="px-5 py-4 flex items-end gap-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(22,22,26,0.07)', backgroundColor: '#FFFFFF' }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Reply… (Enter to send)"
          rows={1}
          aria-label="Reply to client"
          className="yele-textarea flex-1 resize-none"
          style={{ backgroundColor: '#F2F0EB', maxHeight: '100px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          aria-label="Send"
          title="Send"
          className="yele-btn yele-btn-primary flex-shrink-0 w-10 h-10"
          style={{ padding: 0 }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Inner page (uses useSearchParams) ────────────────────────────────────────

function MensajesInner() {
  const searchParams = useSearchParams()
  const [allMessages, setAllMessages]       = useState<Message[]>([])
  const [loading, setLoading]               = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/admin/all-messages')
    if (!res.ok) return
    const data: Message[] = await res.json()
    setAllMessages(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Deep-link from email notification
  useEffect(() => {
    const client = searchParams.get('client')
    if (client) setSelectedClientId(client)
  }, [searchParams])

  const conversations = useMemo(() => buildConversations(allMessages), [allMessages])

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  )

  const handleUnreadChange = useCallback((clientId: string, count: number) => {
    setAllMessages((prev) =>
      prev.map((m) =>
        m.client_id === clientId && m.author_role === 'client' && count === 0
          ? { ...m, read: true }
          : m
      )
    )
  }, [])

  const selectedConv = conversations.find((c) => c.clientId === selectedClientId)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <div
        className="flex items-center gap-3 px-6 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(22,22,26,0.07)' }}
      >
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}
        >
          Messages
        </h1>
        {totalUnread > 0 && (
          <span
            className="yele-pill"
            style={{ backgroundColor: '#16161A', color: '#F2F0EB' }}
          >
            {totalUnread} unread
          </span>
        )}
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: conversation list ── */}
        <div
          className="flex flex-col overflow-hidden flex-shrink-0"
          style={{ width: '300px', borderRight: '1px solid rgba(22,22,26,0.07)' }}
        >
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-1 p-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: '#F2F0EB' }} />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-20 px-6 text-center">
                <MessageSquare size={28} style={{ color: 'rgba(22,22,26,0.25)' }} />
                <p className="text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>
                  No messages yet
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.clientId === selectedClientId
                const preview = conv.lastAuthorRole === 'studio'
                  ? `You: ${conv.lastBody}`
                  : conv.lastBody

                return (
                  <button
                    key={conv.clientId}
                    onClick={() => setSelectedClientId(conv.clientId)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                    style={{
                      backgroundColor: isSelected ? '#F2F0EB' : 'transparent',
                      borderBottom: '1px solid rgba(22,22,26,0.05)',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F7F6F3' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: isSelected ? '#16161A' : '#EEEDE9',
                        color: isSelected ? '#FFFFFF' : '#16161A',
                      }}
                    >
                      {initials(conv.clientName)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}
                        >
                          {conv.clientName}
                        </span>
                        <span
                          className="text-xs flex-shrink-0"
                          style={{ color: conv.unreadCount > 0 ? '#16161A' : '#8A8A92', fontFamily: 'var(--font-mono)', fontWeight: conv.unreadCount > 0 ? 600 : 400 }}
                        >
                          {formatConvTime(conv.lastAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span
                          className="text-xs truncate"
                          style={{
                            color: '#8A8A92',
                            fontFamily: 'var(--font-instrument)',
                            fontWeight: conv.unreadCount > 0 ? 500 : 400,
                          }}
                        >
                          {preview.length > 45 ? preview.slice(0, 45) + '…' : preview}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span
                            className="flex-shrink-0 text-xs font-semibold rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: '#16161A',
                              color: '#F2F0EB',
                              minWidth: '18px',
                              height: '18px',
                              padding: '0 5px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right: thread ── */}
        <div className="flex-1 overflow-hidden">
          {selectedClientId && selectedConv ? (
            <ThreadPanel
              key={selectedClientId}
              clientId={selectedClientId}
              clientName={selectedConv.clientName}
              onUnreadChange={handleUnreadChange}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ backgroundColor: '#F7F6F3' }}>
              <MessageSquare size={36} style={{ color: 'rgba(22,22,26,0.25)' }} />
              <p className="text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>
                Select a conversation
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MensajesPage() {
  return (
    <Suspense>
      <MensajesInner />
    </Suspense>
  )
}
