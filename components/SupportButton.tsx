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
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  }

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
    >
      {/* ── Popup card ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          right: 0,
          width: '256px',
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          transformOrigin: 'bottom right',
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(8px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'transform 0.18s cubic-bezier(0.34,1.3,0.64,1), opacity 0.15s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontFamily: 'var(--font-outfit)', fontWeight: 600, fontSize: '14px', color: '#1D1D1F', margin: 0 }}>
            ¿Necesitas ayuda?
          </p>
          <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#86868B', margin: '2px 0 0' }}>
            Elige cómo contactarnos
          </p>
        </div>

        {/* ── Email row ── */}
        <div
          role="button"
          tabIndex={0}
          style={rowBase}
          onClick={() => copyText(EMAIL, 'email')}
          onKeyDown={(e) => { if (e.key === 'Enter') copyText(EMAIL, 'email') }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F5F7' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: '#F0F0F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={16} style={{ color: '#5856D6' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 500, color: '#1D1D1F', margin: 0 }}>
              Email
            </p>
            <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#86868B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {copied === 'email' ? '¡Copiado!' : EMAIL}
            </p>
          </div>
          {copied === 'email'
            ? <Check size={14} style={{ color: '#34C759', flexShrink: 0 }} />
            : <Copy size={14} style={{ color: '#C7C7CC', flexShrink: 0 }} />
          }
        </div>

        {/* ── WhatsApp row ── */}
        {mobile ? (
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={rowBase}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F5F7' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: '#E8F8ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={16} style={{ color: '#25D366' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 500, color: '#1D1D1F', margin: 0 }}>
                WhatsApp
              </p>
              <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#86868B', margin: 0 }}>
                Abrir WhatsApp
              </p>
            </div>
            <ExternalLink size={14} style={{ color: '#C7C7CC', flexShrink: 0 }} />
          </a>
        ) : (
          <div
            style={rowBase}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F5F7' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: '#E8F8ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={16} style={{ color: '#25D366' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 500, color: '#1D1D1F', margin: 0 }}>
                  WhatsApp
                </p>
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontFamily: 'var(--font-instrument)', fontSize: '11px', color: '#86868B', textDecoration: 'underline', flexShrink: 0 }}
                >
                  Abrir web
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#1D1D1F', margin: 0, fontWeight: 500 }}>
                  {WA_DISP}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); copyText(WA_NUM, 'phone') }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Copiar número"
                >
                  {copied === 'phone'
                    ? <Check size={12} style={{ color: '#34C759' }} />
                    : <Copy size={12} style={{ color: '#C7C7CC' }} />
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
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F5F7' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: '#FFF0E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={16} style={{ color: '#FF9500' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 500, color: '#1D1D1F', margin: 0 }}>
              Chat
            </p>
            <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: '#86868B', margin: 0 }}>
              Enviar un mensaje
            </p>
          </div>
        </button>
      </div>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Soporte"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#1D1D1F',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.28)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.22)' }}
      >
        {open
          ? <X size={20} style={{ color: '#FFFFFF' }} />
          : <MessageCircle size={20} style={{ color: '#FFFFFF' }} />
        }
      </button>
    </div>
  )
}
