'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Save, Send, UtensilsCrossed, Briefcase, Users, Quote, HelpCircle, Tag, Home, Image, CalendarDays } from 'lucide-react'
import CardManager, { FieldDef } from '@/components/CardManager'

// ── Types ──────────────────────────────────────────────────────────────────────

type ClientStatus = 'intake_pending' | 'building' | 'live' | 'paused' | 'cancelled'

interface Client {
  id: string
  business_name: string
  city: string
  industry_type: string
  plan: string
  status: ClientStatus
  phone: string
  email: string
  address: string
  description: string
  dynamic_sections: string[]
  whatsapp_number: string
  preferred_contact: string
  website_url: string
  slug: string
  created_at: string
}

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
}

type Tab = 'info' | 'secciones' | 'mensajes'

// ── Style constants ────────────────────────────────────────────────────────────

const S = {
  card: { backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '20px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#86868B', marginBottom: '4px', fontFamily: 'var(--font-instrument)' },
  input: { backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', color: '#1D1D1F', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', outline: 'none', width: '100%', fontFamily: 'var(--font-instrument)' },
  select: { backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', color: '#1D1D1F', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', outline: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--font-instrument)' },
  btnPrimary: { backgroundColor: '#1D1D1F', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-instrument)' },
  tab: (active: boolean) => ({ padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: active ? '#1D1D1F' : 'transparent', color: active ? '#FFFFFF' : '#86868B', fontFamily: 'var(--font-instrument)' }),
}

const STATUS_OPTIONS = [
  { value: 'intake_pending', label: 'En revisión' },
  { value: 'building',       label: 'En construcción' },
  { value: 'live',           label: 'Activo' },
  { value: 'paused',         label: 'Pausado' },
  { value: 'cancelled',      label: 'Cancelado' },
]

const PLAN_OPTIONS = [
  { value: 'basica',       label: 'Básica' },
  { value: 'profesional',  label: 'Profesional' },
  { value: 'avanzada',     label: 'Avanzada' },
]

const PLAN_LABELS: Record<string, string> = { basica: 'Básica', profesional: 'Profesional', avanzada: 'Avanzada' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Section config (mirrored from contenido page) ──────────────────────────────

const SECTION_CONFIG: Record<string, { title: string; icon: React.ReactNode; fields: FieldDef[] }> = {
  catalog_items: {
    title: 'Carta / Catálogo',
    icon: <UtensilsCrossed size={14} />,
    fields: [
      { key: 'name',        label: 'Nombre',      type: 'text',     required: true, placeholder: 'Ej. Paella valenciana' },
      { key: 'category',    label: 'Categoría',   type: 'text',     placeholder: 'Ej. Arroces' },
      { key: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Describe el producto…' },
      { key: 'price',       label: 'Precio',      type: 'text',     placeholder: 'Ej. 14,50 €' },
      { key: 'image_url',   label: 'Imagen',      type: 'image' },
      { key: 'available',   label: 'Disponible',  type: 'toggle' },
    ],
  },
  services: {
    title: 'Servicios',
    icon: <Briefcase size={14} />,
    fields: [
      { key: 'name',        label: 'Nombre del servicio', type: 'text',     required: true },
      { key: 'description', label: 'Descripción',         type: 'textarea' },
      { key: 'price',       label: 'Precio',              type: 'text',     placeholder: 'Ej. Desde 50 €' },
      { key: 'price_label', label: 'Etiqueta de precio',  type: 'text',     placeholder: 'Ej. Consultar' },
    ],
  },
  team_members: {
    title: 'Equipo',
    icon: <Users size={14} />,
    fields: [
      { key: 'name',      label: 'Nombre', type: 'text', required: true },
      { key: 'role',      label: 'Cargo',  type: 'text' },
      { key: 'photo_url', label: 'Foto',   type: 'image' },
    ],
  },
  testimonials: {
    title: 'Testimonios',
    icon: <Quote size={14} />,
    fields: [
      { key: 'author_name', label: 'Nombre del autor', type: 'text',     required: true },
      { key: 'role',        label: 'Cargo del autor',  type: 'text' },
      { key: 'body',        label: 'Testimonio',       type: 'textarea', required: true },
      { key: 'rating',      label: 'Valoración (1–5)', type: 'number',   placeholder: '5' },
    ],
  },
  faqs: {
    title: 'Preguntas frecuentes',
    icon: <HelpCircle size={14} />,
    fields: [
      { key: 'question', label: 'Pregunta',  type: 'text',     required: true },
      { key: 'answer',   label: 'Respuesta', type: 'textarea', required: true },
    ],
  },
  offers: {
    title: 'Ofertas',
    icon: <Tag size={14} />,
    fields: [
      { key: 'title',       label: 'Título',           type: 'text',     required: true },
      { key: 'badge',       label: 'Etiqueta (badge)', type: 'text',     placeholder: 'Ej. -20%' },
      { key: 'description', label: 'Descripción',      type: 'textarea' },
      { key: 'valid_until', label: 'Válido hasta',     type: 'date' },
    ],
  },
  listings: {
    title: 'Inmuebles',
    icon: <Home size={14} />,
    fields: [
      { key: 'title',    label: 'Título',          type: 'text',   required: true },
      { key: 'type',     label: 'Tipo',            type: 'select', options: ['Venta', 'Alquiler'] },
      { key: 'price',    label: 'Precio',          type: 'text' },
      { key: 'size_m2',  label: 'Superficie (m²)', type: 'number' },
      { key: 'rooms',    label: 'Habitaciones',    type: 'number' },
      { key: 'location', label: 'Ubicación',       type: 'text' },
    ],
  },
  gallery: {
    title: 'Galería',
    icon: <Image size={14} />,
    fields: [
      { key: 'image_url', label: 'Imagen',      type: 'image' },
      { key: 'caption',   label: 'Descripción', type: 'text' },
      { key: 'category',  label: 'Categoría',   type: 'text' },
    ],
  },
  sessions_dates: {
    title: 'Fechas de sesión',
    icon: <CalendarDays size={14} />,
    fields: [
      { key: 'title',            label: 'Título',          type: 'text' },
      { key: 'date',             label: 'Fecha',           type: 'date' },
      { key: 'time',             label: 'Hora',            type: 'text', placeholder: 'Ej. 10:00' },
      { key: 'max_participants', label: 'Máx. asistentes', type: 'number' },
      { key: 'available',        label: 'Disponible',      type: 'toggle' },
    ],
  },
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ClienteDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()

  const [client, setClient]   = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<Tab>('info')

  // editable info state
  const [form, setForm]     = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null)

  // messages state
  const [messages, setMessages]       = useState<Message[]>([])
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [replyInput, setReplyInput]   = useState('')
  const [replySending, setReplySending] = useState(false)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/clients/${clientId}`)
      if (!res.ok) { setLoading(false); return }
      const data: Client = await res.json()
      setClient(data)
      setForm({
        business_name: data.business_name,
        email:         data.email,
        phone:         data.phone,
        plan:          data.plan,
        status:        data.status,
        website_url:   data.website_url,
        city:          data.city,
        industry_type: data.industry_type,
      })
      setLoading(false)
    }
    load()
  }, [clientId])

  useEffect(() => {
    if (tab !== 'mensajes' || !clientId) return
    setMsgsLoading(true)
    fetch(`/api/admin/messages?clientId=${clientId}`)
      .then((r) => r.json())
      .then((data) => { setMessages(data); setMsgsLoading(false) })
      .catch(() => setMsgsLoading(false))
  }, [tab, clientId])

  async function handleSendReply() {
    const text = replyInput.trim()
    if (!text || replySending) return
    setReplySending(true)
    const res = await fetch('/api/admin/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, body: text }),
    })
    setReplySending(false)
    if (res.ok) {
      setReplyInput('')
      const updated = await fetch(`/api/admin/messages?clientId=${clientId}`)
      const data = await updated.json()
      setMessages(data)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast('Error al enviar: ' + (err.error ?? 'desconocido'), false)
    }
  }

  async function handleSaveInfo() {
    setSaving(true)
    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setClient((prev) => prev ? { ...prev, ...form } : prev)
      showToast('Cambios guardados')
    } else {
      const err = await res.json().catch(() => ({}))
      showToast('Error al guardar: ' + (err.error ?? res.statusText), false)
    }
  }

  function patch(key: keyof Client, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl" style={{ backgroundColor: '#F5F5F7' }} />
          <div className="h-64 rounded-2xl" style={{ backgroundColor: '#F5F5F7' }} />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 p-6">
        <p className="text-sm" style={{ color: '#991b1b' }}>Cliente no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/clientes')}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#1D1D1F' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#86868B' }}
      >
        <ArrowLeft size={15} /> Volver a clientes
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
            {client.business_name}
          </h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: '#86868B' }}>{client.id}</p>
        </div>
        {client.plan && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#F5F5F7', color: '#86868B', border: '1px solid rgba(0,0,0,0.08)', fontFamily: 'var(--font-instrument)' }}
          >
            {PLAN_LABELS[client.plan] ?? client.plan}
          </span>
        )}
        {client.website_url && (
          <a
            href={client.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: '#C8A97E', fontFamily: 'var(--font-instrument)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#92400e' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#C8A97E' }}
          >
            <ExternalLink size={12} /> Ver web
          </a>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F5F5F7', width: 'fit-content' }}>
        {(['info', 'secciones', 'mensajes'] as Tab[]).map((t) => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'info' ? 'Información' : t === 'secciones' ? 'Secciones' : 'Mensajes'}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {tab === 'info' && (
        <div style={S.card} className="max-w-2xl space-y-5">
          <h2 className="text-sm font-semibold" style={{ color: '#1D1D1F', fontFamily: 'var(--font-outfit)' }}>Datos del cliente</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={S.label}>Nombre del negocio</label>
              <input style={S.input} value={form.business_name ?? ''} onChange={(e) => patch('business_name', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" value={form.email ?? ''} onChange={(e) => patch('email', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Teléfono</label>
              <input style={S.input} value={form.phone ?? ''} onChange={(e) => patch('phone', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Ciudad</label>
              <input style={S.input} value={form.city ?? ''} onChange={(e) => patch('city', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Sector</label>
              <input style={S.input} value={form.industry_type ?? ''} onChange={(e) => patch('industry_type', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>URL del sitio</label>
              <input style={S.input} value={form.website_url ?? ''} onChange={(e) => patch('website_url', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Plan</label>
              <select style={S.select} value={form.plan ?? ''} onChange={(e) => patch('plan', e.target.value)}>
                {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Estado</label>
              <select style={S.select} value={form.status ?? ''} onChange={(e) => patch('status', e.target.value as ClientStatus)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />

          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>Alta: {formatDate(client.created_at)}</p>
            <button style={S.btnPrimary} onClick={handleSaveInfo} disabled={saving}>
              <Save size={13} />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}

      {/* ── SECCIONES TAB ── */}
      {tab === 'secciones' && (
        <div className="space-y-6">
          {(!client.dynamic_sections || client.dynamic_sections.length === 0) ? (
            <div style={{ ...S.card, textAlign: 'center' }} className="py-10">
              <p className="text-sm" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>Este cliente no tiene secciones dinámicas configuradas.</p>
            </div>
          ) : (
            client.dynamic_sections.map((sectionKey) => {
              const cfg = SECTION_CONFIG[sectionKey]
              if (!cfg) return (
                <div key={sectionKey} style={S.card}>
                  <p className="text-xs font-mono" style={{ color: '#86868B' }}>{sectionKey} — sin configuración</p>
                </div>
              )
              return (
                <CardManager
                  key={sectionKey}
                  sectionKey={sectionKey}
                  clientId={clientId}
                  clientSlug={client.slug}
                  title={cfg.title}
                  icon={cfg.icon}
                  fields={cfg.fields}
                />
              )
            })
          )}
        </div>
      )}

      {/* ── MENSAJES TAB ── */}
      {tab === 'mensajes' && (
        <div
          className="max-w-2xl flex flex-col"
          style={{ ...S.card, padding: 0, overflow: 'hidden', height: '520px' }}
        >
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {msgsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: '#F5F5F7' }} />)}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>Sin mensajes aún.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isStudio = msg.author_role === 'studio'
                const senderName = msg.name ?? (isStudio ? 'Yele Studio' : '—')
                const body = msg.body ?? msg.message ?? ''
                return (
                  <div key={msg.id} className={`flex ${isStudio ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-xs space-y-1"
                      style={{
                        backgroundColor: isStudio ? '#1D1D1F' : '#F5F5F7',
                        color: isStudio ? '#FFFFFF' : '#1D1D1F',
                        borderRadius: isStudio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        fontFamily: 'var(--font-instrument)',
                      }}
                    >
                      {!isStudio && (
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#86868B', marginBottom: '2px' }}>
                          {senderName}
                        </p>
                      )}
                      <p style={{ lineHeight: '1.5' }}>{body}</p>
                      <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>{formatDateTime(msg.created_at)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Reply form */}
          <div
            className="flex items-end gap-2 p-3"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <textarea
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() } }}
              placeholder="Escribe un mensaje… (Enter para enviar)"
              rows={2}
              style={{ ...S.input, resize: 'none', flex: 1 }}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyInput.trim() || replySending}
              style={{
                ...S.btnPrimary,
                opacity: (!replyInput.trim() || replySending) ? 0.45 : 1,
                paddingLeft: '14px',
                paddingRight: '14px',
              }}
            >
              <Send size={13} />
              {replySending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{
            backgroundColor: toast.ok ? 'rgba(6,95,70,0.08)' : 'rgba(153,27,27,0.08)',
            border: `1px solid ${toast.ok ? 'rgba(6,95,70,0.2)' : 'rgba(153,27,27,0.2)'}`,
            color: toast.ok ? '#065f46' : '#991b1b',
            fontFamily: 'var(--font-instrument)',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
