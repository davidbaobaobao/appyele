'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Mail, Phone, MessageSquare, Copy, Check, ExternalLink } from 'lucide-react'

const EMAIL    = 'info@yele.design'
const WA_NUM   = '8615021336924'
const WA_DISP  = '+86 150 2133 6924'
const WA_URL   = `https://wa.me/${WA_NUM}`

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

export default function SupportButton() {
  const [open, setOpen]         = useState(false)
  const [mobile, setMobile]     = useState(false)
  const [copied, setCopied]     = useState<'email' | 'phone' | null>(null)
  const ref    = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { setMobile(isMobileDevice()) }, [])

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  function copyText(text: string, which: 'email' | 'phone') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const rowBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.12s',
    textDecoration: 'none',
    color: 'inherit',
    borderBottom: '1px solid rgba(22,22,26,0.05)',
  }

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
    >
      {/* ── Popup card ── */}
      <div
        className="yele-card"
        style={{
          position: 'absolute',
          bottom: '60px',
          right: 0,
          width: '256px',
          overflow: 'hidden',
          transformOrigin: 'bottom right',
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(8px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'transform 0.18s cubic-bezier(0.34,1.3,0.64,1), opacity 0.15s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(22,22,26,0.06)' }}>
          <p className="yele-eyebrow" style={{ margin: 0 }}>Support</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: '#16161A', margin: '6px 0 0', letterSpacing: '-0.015em' }}>
            Need help?
          </p>
        </div>

        {/* ── Email row ── */}
        <div
          role="button"
          tabIndex={0}
          style={rowBase}
          onClick={() => copyText(EMAIL, 'email')}
          onKeyDown={(e) => { if (e.key === 'Enter') copyText(EMAIL, 'email') }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F2F0EB' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: 'rgba(43,79,168,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={16} style={{ color: '#2B4FA8' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 500, color: '#16161A', margin: 0 }}>
              Email
            </p>
            <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#8A8A92', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {copied === 'email' ? 'Copied' : EMAIL}
            </p>
          </div>
          {copied === 'email'
            ? <Check size={14} style={{ color: '#1F7A55', flexShrink: 0 }} />
            : <Copy size={14} style={{ color: 'rgba(22,22,26,0.25)', flexShrink: 0 }} />
          }
        </div>

        {/* ── WhatsApp row ── */}
        {mobile ? (
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={rowBase}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F2F0EB' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: 'rgba(31,122,85,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={16} style={{ color: '#25D366' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 500, color: '#16161A', margin: 0 }}>
                WhatsApp
              </p>
              <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#8A8A92', margin: 0 }}>
                Open WhatsApp
              </p>
            </div>
            <ExternalLink size={14} style={{ color: 'rgba(22,22,26,0.25)', flexShrink: 0 }} />
          </a>
        ) : (
          <div
            style={rowBase}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F2F0EB' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: 'rgba(31,122,85,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={16} style={{ color: '#25D366' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 500, color: '#16161A', margin: 0 }}>
                  WhatsApp
                </p>
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontFamily: 'var(--font-instrument)', fontSize: '11px', color: '#8A8A92', textDecoration: 'underline', flexShrink: 0 }}
                >
                  Open web
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#16161A', margin: 0, fontWeight: 500 }}>
                  {WA_DISP}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); copyText(WA_NUM, 'phone') }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Copy number"
                >
                  {copied === 'phone'
                    ? <Check size={12} style={{ color: '#1F7A55' }} />
                    : <Copy size={12} style={{ color: 'rgba(22,22,26,0.25)' }} />
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Chat row ── */}
        <button
          style={{ ...rowBase, width: '100%', borderBottom: 'none', background: 'none' }}
          onClick={() => { router.push('/mensajes'); setOpen(false) }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F2F0EB' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: 'rgba(212,111,200,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={16} style={{ color: '#D46FC8' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 500, color: '#16161A', margin: 0 }}>
              Chat
            </p>
            <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#8A8A92', margin: 0 }}>
              Send a message
            </p>
          </div>
        </button>
      </div>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Support"
        className="yele-btn yele-btn-primary"
        style={{
          width: '48px',
          height: '48px',
          padding: 0,
          boxShadow: '0 4px 16px rgba(22,22,26,0.22)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(22,22,26,0.28)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,22,26,0.22)' }}
      >
        {open
          ? <X size={20} style={{ color: '#FFFFFF' }} />
          : <MessageCircle size={20} style={{ color: '#FFFFFF' }} />
        }
      </button>
    </div>
  )
}
