'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Save, Send, UtensilsCrossed, Briefcase, Users, Quote, HelpCircle, Tag, Home, Image, CalendarDays, Palette, FileDown, Check } from 'lucide-react'
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
  design_survey: Record<string, unknown>
  design_survey_completed: boolean
  design_survey_submitted_at: string | null
}

type SurveyData = Record<string, string | string[]>

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

type Tab = 'info' | 'secciones' | 'mensajes' | 'diseno'

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

  // design survey state
  const [survey, setSurvey]               = useState<SurveyData>({})
  const [surveyCompleted, setSurveyCompleted] = useState(false)
  const [surveyAt, setSurveyAt]           = useState<string | null>(null)
  const [surveySaving, setSurveySaving]   = useState(false)

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
      setSurvey((data.design_survey as SurveyData) ?? {})
      setSurveyCompleted(data.design_survey_completed ?? false)
      setSurveyAt(data.design_survey_submitted_at ?? null)
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

  function patchSurvey(key: string, value: string | string[]) {
    setSurvey((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSaveSurvey() {
    setSurveySaving(true)
    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ design_survey: survey }),
    })
    setSurveySaving(false)
    if (res.ok) showToast('Briefing guardado')
    else showToast('Error al guardar el briefing', false)
  }

  function downloadPDF() {
    if (!client) return
    const s = survey
    const str = (k: string) => (s[k] as string) || ''
    const arr = (k: string): string[] => Array.isArray(s[k]) ? s[k] as string[] : []

    function row(label: string, value: string) {
      if (!value?.trim()) return ''
      return `<tr>
        <td style="padding:4px 0;font-size:11px;color:#86868B;width:160px;vertical-align:top;">${label}</td>
        <td style="padding:4px 0;font-size:13px;color:#1D1D1F;vertical-align:top;white-space:pre-wrap;">${value.replace(/</g,'&lt;')}</td>
      </tr>`
    }
    function sec(title: string, rows: string) {
      const content = rows.trim()
      if (!content) return ''
      return `<div style="margin-bottom:22px;page-break-inside:avoid;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#86868B;border-bottom:1px solid #E5E5EA;padding-bottom:5px;margin-bottom:10px;">${title}</div>
        <table style="width:100%;border-collapse:collapse;">${content}</table>
      </div>`
    }

    const pages = arr('paginas')
    const fotos = arr('fotos_urls')

    const html = `<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8">
      <title>Briefing — ${client.business_name}</title>
      <style>
        @page { margin: 18mm 20mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, Arial, sans-serif; color: #1D1D1F; font-size: 13px; margin: 0; }
        @media print { .no-print { display: none; } }
      </style>
    </head><body>
      <div class="no-print" style="background:#1D1D1F;color:#fff;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;">Presiona <strong>Ctrl+P</strong> / <strong>⌘P</strong> y elige «Guardar como PDF»</span>
        <button onclick="window.print()" style="background:#E8A020;color:#000;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;">Imprimir / Guardar PDF</button>
      </div>
      <div style="max-width:700px;margin:28px auto;padding:0 20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:2px solid #1D1D1F;margin-bottom:24px;">
          <div>
            <div style="font-size:22px;font-weight:700;">${client.business_name}</div>
            <div style="font-size:12px;color:#86868B;margin-top:3px;">
              Briefing de diseño web · ${surveyAt ? new Date(surveyAt).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}) : new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}
              ${surveyCompleted ? ' · <span style="color:#2A8A5A;font-weight:600;">✓ Enviado por el cliente</span>' : ''}
            </div>
          </div>
          <div style="font-size:16px;font-weight:700;color:#1D1D1F;">Yele Studio</div>
        </div>

        ${sec('Tu negocio', [
          row('Descripción', str('descripcion_negocio')),
          row('Servicio 1', [str('servicio_1_nombre'), str('servicio_1_precio')].filter(Boolean).join(' — ')),
          row('Servicio 2', [str('servicio_2_nombre'), str('servicio_2_precio')].filter(Boolean).join(' — ')),
          row('Servicio 3', [str('servicio_3_nombre'), str('servicio_3_precio')].filter(Boolean).join(' — ')),
          row('Cliente ideal', str('cliente_ideal')),
          row('Diferenciador', str('diferenciador')),
        ].join(''))}

        ${sec('Contenido', [
          row('Años experiencia', str('anos_experiencia')),
          row('Horario', str('horario')),
          row('Zona de cobertura', str('zona_cobertura')),
          row('Historia', str('historia')),
          row('Testimonio 1', str('testimonio_1_nombre') ? `${str('testimonio_1_nombre')} (${str('testimonio_1_ciudad')}): ${str('testimonio_1_texto')}` : ''),
          row('Testimonio 2', str('testimonio_2_nombre') ? `${str('testimonio_2_nombre')} (${str('testimonio_2_ciudad')}): ${str('testimonio_2_texto')}` : ''),
          row('Testimonio 3', str('testimonio_3_nombre') ? `${str('testimonio_3_nombre')} (${str('testimonio_3_ciudad')}): ${str('testimonio_3_texto')}` : ''),
        ].join(''))}

        ${sec('Identidad visual', [
          row('Logo', str('tiene_logo')),
          row('URL logo', str('logo_url')),
          row('Fotos', str('tiene_fotos')),
          row('Fotos subidas', fotos.length ? `${fotos.length} foto(s)` : ''),
          row('Estilo visual', str('estilo_visual')),
          row('Referencias', str('referencias_urls')),
          row('Colores de marca', str('colores_marca')),
        ].join(''))}

        ${sec('La web', [
          row('Páginas', pages.length ? pages.join(', ') : ''),
          row('Tipo de contacto', str('contacto_tipo')),
          row('Dominio', str('tiene_dominio') === 'si' ? `Sí — ${str('dominio_actual')}` : str('tiene_dominio')),
          row('Extras', str('extras')),
        ].join(''))}

        ${sec('Contacto y redes', [
          row('Teléfono', str('telefono')),
          row('Email', str('email_contacto')),
          row('WhatsApp', str('whatsapp')),
          row('Dirección', str('direccion')),
          row('Instagram', str('instagram')),
          row('Facebook', str('facebook')),
          row('Google Business', str('google_business')),
        ].join(''))}

        <div style="margin-top:32px;padding-top:12px;border-top:1px solid #E5E5EA;font-size:11px;color:#86868B;display:flex;justify-content:space-between;">
          <span>Yele Studio · yele.design</span>
          <span>${client.id}</span>
        </div>
      </div>
    </body></html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
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
        {(['info', 'secciones', 'mensajes', 'diseno'] as Tab[]).map((t) => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'info' ? 'Información' : t === 'secciones' ? 'Secciones' : t === 'mensajes' ? 'Mensajes' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Palette size={12} />
                Diseño
                {surveyCompleted && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2A8A5A', display: 'inline-block' }} />}
              </span>
            )}
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

      {/* ── DISEÑO TAB ── */}
      {tab === 'diseno' && (
        <div className="space-y-4 max-w-2xl">

          {/* Status + actions bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {surveyCompleted ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(42,138,90,0.08)', color: '#2A8A5A', border: '1px solid rgba(42,138,90,0.2)', fontFamily: 'var(--font-instrument)' }}>
                  <Check size={11} /> Enviado por el cliente
                  {surveyAt && <span style={{ fontWeight: 400, color: '#86868B', marginLeft: '4px' }}>{formatDate(surveyAt)}</span>}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#F5F5F7', color: '#86868B', fontFamily: 'var(--font-instrument)' }}>
                  Pendiente de envío
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#F5F5F7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.08)', fontFamily: 'var(--font-instrument)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EBEBED' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
              >
                <FileDown size={13} /> Descargar PDF
              </button>
              <button onClick={handleSaveSurvey} disabled={surveySaving} style={{ ...S.btnPrimary, opacity: surveySaving ? 0.6 : 1 }}>
                <Save size={13} />
                {surveySaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          {/* ── Block 1: Negocio ── */}
          <SurveyCard title="Tu negocio">
            <SurveyField label="Descripción del negocio">
              <SurveyTextarea value={survey['descripcion_negocio'] as string ?? ''} onChange={(v) => patchSurvey('descripcion_negocio', v)} rows={3} />
            </SurveyField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <SurveyField label="Cliente ideal">
                <SurveyTextarea value={survey['cliente_ideal'] as string ?? ''} onChange={(v) => patchSurvey('cliente_ideal', v)} rows={2} />
              </SurveyField>
              <SurveyField label="Diferenciador">
                <SurveyInput value={survey['diferenciador'] as string ?? ''} onChange={(v) => patchSurvey('diferenciador', v)} />
              </SurveyField>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#86868B', marginBottom: '8px', fontFamily: 'var(--font-instrument)' }}>
                Servicios
              </p>
              {([1, 2, 3] as const).map((i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', marginBottom: '6px' }}>
                  <SurveyInput
                    value={survey[`servicio_${i}_nombre`] as string ?? ''}
                    onChange={(v) => patchSurvey(`servicio_${i}_nombre`, v)}
                    placeholder={`Servicio ${i}`}
                  />
                  <SurveyInput
                    value={survey[`servicio_${i}_precio`] as string ?? ''}
                    onChange={(v) => patchSurvey(`servicio_${i}_precio`, v)}
                    placeholder="Precio"
                  />
                </div>
              ))}
            </div>
          </SurveyCard>

          {/* ── Block 2: Contenido ── */}
          <SurveyCard title="Contenido real">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SurveyField label="Años de experiencia">
                <SurveyInput value={survey['anos_experiencia'] as string ?? ''} onChange={(v) => patchSurvey('anos_experiencia', v)} />
              </SurveyField>
              <SurveyField label="Zona de cobertura">
                <SurveyInput value={survey['zona_cobertura'] as string ?? ''} onChange={(v) => patchSurvey('zona_cobertura', v)} />
              </SurveyField>
            </div>
            <SurveyField label="Horario" style={{ marginTop: '12px' }}>
              <SurveyInput value={survey['horario'] as string ?? ''} onChange={(v) => patchSurvey('horario', v)} />
            </SurveyField>
            <SurveyField label="Historia del negocio" style={{ marginTop: '12px' }}>
              <SurveyTextarea value={survey['historia'] as string ?? ''} onChange={(v) => patchSurvey('historia', v)} rows={3} />
            </SurveyField>
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#86868B', marginBottom: '8px', fontFamily: 'var(--font-instrument)' }}>
                Testimonios
              </p>
              {([1, 2, 3] as const).map((i) => (
                <div key={i} style={{ backgroundColor: '#FAFAFA', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <SurveyInput value={survey[`testimonio_${i}_nombre`] as string ?? ''} onChange={(v) => patchSurvey(`testimonio_${i}_nombre`, v)} placeholder="Nombre" />
                    <SurveyInput value={survey[`testimonio_${i}_ciudad`] as string ?? ''} onChange={(v) => patchSurvey(`testimonio_${i}_ciudad`, v)} placeholder="Ciudad" />
                  </div>
                  <SurveyTextarea value={survey[`testimonio_${i}_texto`] as string ?? ''} onChange={(v) => patchSurvey(`testimonio_${i}_texto`, v)} placeholder="Texto del testimonio…" rows={2} />
                </div>
              ))}
            </div>
          </SurveyCard>

          {/* ── Block 3: Identidad visual ── */}
          <SurveyCard title="Identidad visual">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SurveyField label="Logo">
                <SurveyPills
                  options={[{ value: 'si', label: 'Sí lo tiene' }, { value: 'no', label: 'No tiene' }, { value: 'en_proceso', label: 'En proceso' }]}
                  value={survey['tiene_logo'] as string ?? ''}
                  onChange={(v) => patchSurvey('tiene_logo', v)}
                />
              </SurveyField>
              <SurveyField label="Fotos">
                <SurveyPills
                  options={[{ value: 'si', label: 'Sí tiene' }, { value: 'no', label: 'No tiene' }, { value: 'pronto', label: 'Pronto' }]}
                  value={survey['tiene_fotos'] as string ?? ''}
                  onChange={(v) => patchSurvey('tiene_fotos', v)}
                />
              </SurveyField>
            </div>
            {(survey['logo_url'] || (survey['fotos_urls'] as string[] ?? []).length > 0) && (
              <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: '#F5F5F7', borderRadius: '8px', fontSize: '12px', color: '#86868B', fontFamily: 'var(--font-instrument)' }}>
                {survey['logo_url'] && <p style={{ margin: '0 0 4px' }}>Logo: <a href={survey['logo_url'] as string} target="_blank" rel="noreferrer" style={{ color: '#1D1D1F' }}>ver archivo</a></p>}
                {(survey['fotos_urls'] as string[] ?? []).length > 0 && <p style={{ margin: 0 }}>{(survey['fotos_urls'] as string[]).length} foto(s) subida(s)</p>}
              </div>
            )}
            <SurveyField label="Estilo visual" style={{ marginTop: '12px' }}>
              <SurveyPills
                options={[
                  { value: 'elegante',   label: 'Elegante' },
                  { value: 'calido',     label: 'Cálido' },
                  { value: 'moderno',    label: 'Moderno' },
                  { value: 'artesanal',  label: 'Artesanal' },
                  { value: 'atrevido',   label: 'Atrevido' },
                  { value: 'escogenos',  label: '✦ Escoge tú' },
                ]}
                value={survey['estilo_visual'] as string ?? ''}
                onChange={(v) => patchSurvey('estilo_visual', v)}
              />
            </SurveyField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <SurveyField label="Referencias (URLs)">
                <SurveyTextarea value={survey['referencias_urls'] as string ?? ''} onChange={(v) => patchSurvey('referencias_urls', v)} rows={2} />
              </SurveyField>
              <SurveyField label="Colores de marca">
                <SurveyInput value={survey['colores_marca'] as string ?? ''} onChange={(v) => patchSurvey('colores_marca', v)} />
              </SurveyField>
            </div>
          </SurveyCard>

          {/* ── Block 4: La web ── */}
          <SurveyCard title="La web">
            <SurveyField label="Páginas seleccionadas">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {['inicio','servicios','sobre_mi','galeria','blog','precios','contacto','reservas','tienda','otro'].map((p) => {
                  const pages = (survey['paginas'] as string[]) ?? []
                  const locked = p === 'inicio'
                  const selected = pages.includes(p) || locked
                  return (
                    <button key={p} type="button" disabled={locked}
                      onClick={() => {
                        const updated = pages.includes(p) ? pages.filter((x) => x !== p) : [...pages, p]
                        patchSurvey('paginas', updated)
                      }}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: locked ? 'default' : 'pointer',
                        fontFamily: 'var(--font-instrument)',
                        border: `1px solid ${selected ? '#E8A020' : 'rgba(0,0,0,0.08)'}`,
                        backgroundColor: selected ? 'rgba(232,160,32,0.08)' : 'transparent',
                        color: selected ? '#E8A020' : '#86868B',
                      }}
                    >
                      {selected && !locked && <Check size={10} style={{ display: 'inline', marginRight: 4 }} />}
                      {p.replace('_', ' ')}
                    </button>
                  )
                })}
              </div>
            </SurveyField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <SurveyField label="Tipo de contacto">
                <SurveyPills
                  options={[{ value: 'formulario', label: 'Formulario' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'ambos', label: 'Ambos' }, { value: 'no', label: 'No' }]}
                  value={survey['contacto_tipo'] as string ?? ''}
                  onChange={(v) => patchSurvey('contacto_tipo', v)}
                />
              </SurveyField>
              <SurveyField label="Dominio">
                <SurveyPills
                  options={[{ value: 'si', label: 'Tiene dominio' }, { value: 'no', label: 'Necesita uno' }]}
                  value={survey['tiene_dominio'] as string ?? ''}
                  onChange={(v) => patchSurvey('tiene_dominio', v)}
                />
                {survey['tiene_dominio'] === 'si' && (
                  <div style={{ marginTop: '6px' }}>
                    <SurveyInput value={survey['dominio_actual'] as string ?? ''} onChange={(v) => patchSurvey('dominio_actual', v)} placeholder="ej. minegocio.es" />
                  </div>
                )}
              </SurveyField>
            </div>
            <SurveyField label="Extras / funcionalidades especiales" style={{ marginTop: '12px' }}>
              <SurveyTextarea value={survey['extras'] as string ?? ''} onChange={(v) => patchSurvey('extras', v)} rows={2} />
            </SurveyField>
          </SurveyCard>

          {/* ── Block 5: Contacto y redes ── */}
          <SurveyCard title="Contacto y redes">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SurveyField label="Teléfono"><SurveyInput value={survey['telefono'] as string ?? ''} onChange={(v) => patchSurvey('telefono', v)} /></SurveyField>
              <SurveyField label="Email de contacto"><SurveyInput value={survey['email_contacto'] as string ?? ''} onChange={(v) => patchSurvey('email_contacto', v)} /></SurveyField>
              <SurveyField label="WhatsApp"><SurveyInput value={survey['whatsapp'] as string ?? ''} onChange={(v) => patchSurvey('whatsapp', v)} /></SurveyField>
              <SurveyField label="Dirección"><SurveyInput value={survey['direccion'] as string ?? ''} onChange={(v) => patchSurvey('direccion', v)} /></SurveyField>
              <SurveyField label="Instagram"><SurveyInput value={survey['instagram'] as string ?? ''} onChange={(v) => patchSurvey('instagram', v)} /></SurveyField>
              <SurveyField label="Facebook"><SurveyInput value={survey['facebook'] as string ?? ''} onChange={(v) => patchSurvey('facebook', v)} /></SurveyField>
            </div>
            <SurveyField label="Google Business" style={{ marginTop: '12px' }}>
              <SurveyInput value={survey['google_business'] as string ?? ''} onChange={(v) => patchSurvey('google_business', v)} placeholder="https://maps.google.com/…" />
            </SurveyField>
          </SurveyCard>

          {/* Bottom save */}
          <div className="flex justify-end pb-8">
            <button onClick={handleSaveSurvey} disabled={surveySaving} style={{ ...S.btnPrimary, opacity: surveySaving ? 0.6 : 1 }}>
              <Save size={13} />
              {surveySaving ? 'Guardando…' : 'Guardar cambios'}
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

// ── Survey sub-components ─────────────────────────────────────────────────────

function SurveyCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '20px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1D1D1F', marginBottom: '14px', fontFamily: 'var(--font-outfit)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function SurveyField({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#86868B', marginBottom: '5px', fontFamily: 'var(--font-instrument)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SurveyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', color: '#1D1D1F', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', outline: 'none', width: '100%', fontFamily: 'var(--font-instrument)' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
    />
  )
}

function SurveyTextarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', color: '#1D1D1F', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', outline: 'none', width: '100%', resize: 'vertical', fontFamily: 'var(--font-instrument)' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
    />
  )
}

function SurveyPills({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
      {options.map((opt) => {
        const sel = value === opt.value
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'var(--font-instrument)',
              border: `1px solid ${sel ? '#E8A020' : 'rgba(0,0,0,0.08)'}`,
              backgroundColor: sel ? 'rgba(232,160,32,0.08)' : '#FFFFFF',
              color: sel ? '#E8A020' : '#86868B',
              transition: 'all 0.12s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
