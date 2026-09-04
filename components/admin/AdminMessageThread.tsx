'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
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
    const res = await fetch(`/api/admin/messages?clientId=${clientId}`)
    if (!res.ok) { console.error('admin messages fetch:', res.status, await res.text()); return }
    const data = await res.json()
    setMessages(data)
    setLoading(false)
  }, [clientId])

  // Mark client messages as read when thread is viewed
  const markClientRead = useCallback(async () => {
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
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

    const res = await fetch('/api/admin/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, body }),
    })

    if (!res.ok) {
      console.error('admin send error:', res.status, await res.text())
    } else {
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
      className="yele-card-dark flex flex-col"
      style={{ height: '600px' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: '#F2F0EB' }}>Messages</h3>
        <span className="yele-eyebrow yele-eyebrow-invert">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="h-10 rounded-2xl" style={{ width: `${120 + i * 30}px`, backgroundColor: 'rgba(242,240,235,0.08)' }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12 text-center">
            <p className="text-sm" style={{ color: '#8A8A92' }}>No messages yet</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Date separator */}
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
                <span className="yele-eyebrow yele-eyebrow-invert">{formatDate(group.date)}</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
              </div>

              {group.messages.map((msg) => {
                const isClient = msg.author_role === 'client'
                return (
                  <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <div style={{ maxWidth: '75%' }}>
                      {/* Role label */}
                      <div className={`yele-eyebrow yele-eyebrow-invert mb-1 ${isClient ? 'text-right' : 'text-left'}`}>
                        {isClient ? 'Client' : 'Studio'}
                      </div>
                      <div
                        className="px-3 py-2 text-sm leading-relaxed"
                        style={{
                          backgroundColor: isClient ? '#FFFFFF' : '#16161A',
                          color: isClient ? '#16161A' : '#F2F0EB',
                          borderRadius: isClient ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                          border: isClient ? '1px solid rgba(22,22,26,0.08)' : '1px solid rgba(255,255,255,0.12)',
                        }}
                      >
                        {msg.body}
                      </div>
                      <div
                        className={`text-xs mt-1 ${isClient ? 'text-right' : 'text-left'}`}
                        style={{ color: '#8A8A92', fontFamily: 'var(--font-mono)' }}
                      >
                        {formatTime(msg.created_at)}
                        {isClient && !msg.read && (
                          <span className="ml-1" style={{ color: '#D46FC8' }}>● unread</span>
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
        style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Reply to the client… (Enter to send)"
          rows={1}
          aria-label="Reply to the client"
          className="yele-textarea flex-1 resize-none"
          style={{
            backgroundColor: '#0D0E12',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#F2F0EB',
            maxHeight: '120px',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,111,200,0.55)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="yele-btn yele-btn-accent flex-shrink-0"
        >
          <Send size={13} />
          {sending ? 'Sending…' : 'Reply'}
        </button>
      </div>
    </div>
  )
}
