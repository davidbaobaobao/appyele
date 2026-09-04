'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Save, Send, UtensilsCrossed, Briefcase, Users, Quote, HelpCircle, Tag, Home, Image, CalendarDays, Palette, FileDown, Check } from 'lucide-react'
import CardManager, { FieldDef } from '@/components/CardManager'

// `listings.type` is stored in Supabase as 'Venta' / 'Alquiler'; only the display label is English.
const LISTING_TYPE_LABELS: Record<string, string> = { Venta: 'For sale', Alquiler: 'For rent' }

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

// ── Display labels ─────────────────────────────────────────────────────────────
// NOTE: `value` on every option below is the value stored in Supabase — never
// translate it. Only `label` (what the user reads) is English.

const STATUS_OPTIONS = [
  { value: 'intake_pending', label: 'In review' },
  { value: 'building',       label: 'In progress' },
  { value: 'live',           label: 'Live' },
  { value: 'paused',         label: 'Paused' },
  { value: 'cancelled',      label: 'Cancelled' },
]

const PLAN_OPTIONS = [
  { value: 'basica',       label: 'Starter' },
  { value: 'profesional',  label: 'Pro' },
  { value: 'avanzada',     label: 'Advanced' },
]

const PLAN_LABELS: Record<string, string> = { basica: 'Starter', profesional: 'Pro', avanzada: 'Advanced' }

// Stored page keys (left column) → English display label (right column)
const PAGE_LABELS: Record<string, string> = {
  inicio: 'Home', servicios: 'Services', sobre_mi: 'About', galeria: 'Gallery',
  blog: 'Blog', precios: 'Pricing', contacto: 'Contact', reservas: 'Bookings',
  tienda: 'Shop', otro: 'Other',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Section config (mirrored from contenido page) ──────────────────────────────

const SECTION_CONFIG: Record<string, { title: string; icon: React.ReactNode; fields: FieldDef[] }> = {
  catalog_items: {
    title: 'Menu / Catalog',
    icon: <UtensilsCrossed size={14} />,
    fields: [
      { key: 'name',        label: 'Name',        type: 'text',     required: true, placeholder: 'e.g. Seafood paella' },
      { key: 'category',    label: 'Category',    type: 'text',     placeholder: 'e.g. Mains' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the item…' },
      { key: 'price',       label: 'Price',       type: 'text',     placeholder: 'e.g. $14.50' },
      { key: 'image_url',   label: 'Image',       type: 'image' },
      { key: 'available',   label: 'Available',   type: 'toggle' },
    ],
  },
  services: {
    title: 'Services',
    icon: <Briefcase size={14} />,
    fields: [
      { key: 'name',        label: 'Service name', type: 'text',     required: true },
      { key: 'description', label: 'Description',  type: 'textarea' },
      { key: 'price',       label: 'Price',        type: 'text',     placeholder: 'e.g. From $50' },
      { key: 'price_label', label: 'Price label',  type: 'text',     placeholder: 'e.g. On request' },
    ],
  },
  team_members: {
    title: 'Team',
    icon: <Users size={14} />,
    fields: [
      { key: 'name',      label: 'Name',  type: 'text', required: true },
      { key: 'role',      label: 'Role',  type: 'text' },
      { key: 'photo_url', label: 'Photo', type: 'image' },
    ],
  },
  testimonials: {
    title: 'Testimonials',
    icon: <Quote size={14} />,
    fields: [
      { key: 'author_name', label: 'Author name', type: 'text',     required: true },
      { key: 'role',        label: 'Author role', type: 'text' },
      { key: 'body',        label: 'Testimonial', type: 'textarea', required: true },
      { key: 'rating',      label: 'Rating (1–5)', type: 'number',  placeholder: '5' },
    ],
  },
  faqs: {
    title: 'FAQs',
    icon: <HelpCircle size={14} />,
    fields: [
      { key: 'question', label: 'Question', type: 'text',     required: true },
      { key: 'answer',   label: 'Answer',   type: 'textarea', required: true },
    ],
  },
  offers: {
    title: 'Offers',
    icon: <Tag size={14} />,
    fields: [
      { key: 'title',       label: 'Title',       type: 'text',     required: true },
      { key: 'badge',       label: 'Badge',       type: 'text',     placeholder: 'e.g. -20%' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'valid_until', label: 'Valid until', type: 'date' },
    ],
  },
  listings: {
    title: 'Listings',
    icon: <Home size={14} />,
    fields: [
      { key: 'title',    label: 'Title',      type: 'text',   required: true },
      // 'Venta' / 'Alquiler' are stored values, also compared in CardManager — left as-is
      { key: 'type',     label: 'Type',       type: 'select', options: ['Venta', 'Alquiler'], optionLabels: LISTING_TYPE_LABELS },
      { key: 'price',    label: 'Price',      type: 'text' },
      { key: 'size_m2',  label: 'Size (m²)',  type: 'number' },
      { key: 'rooms',    label: 'Rooms',      type: 'number' },
      { key: 'location', label: 'Location',   type: 'text' },
    ],
  },
  gallery: {
    title: 'Showcase',
    icon: <Image size={14} />,
    fields: [
      { key: 'image_url', label: 'Image',    type: 'image' },
      { key: 'caption',   label: 'Caption',  type: 'text' },
      { key: 'category',  label: 'Category', type: 'text' },
    ],
  },
  sessions_dates: {
    title: 'Session dates',
    icon: <CalendarDays size={14} />,
    fields: [
      { key: 'title',            label: 'Title',        type: 'text' },
      { key: 'date',             label: 'Date',         type: 'date' },
      { key: 'time',             label: 'Time',         type: 'text', placeholder: 'e.g. 10:00' },
      { key: 'max_participants', label: 'Max attendees', type: 'number' },
      { key: 'available',        label: 'Available',    type: 'toggle' },
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

  // sections state
  const [localSections, setLocalSections]     = useState<string[]>([])
  const [sectionsSaving, setSectionsSaving]   = useState(false)
  const [sectionsChanged, setSectionsChanged] = useState(false)

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
      setLocalSections(data.dynamic_sections ?? [])
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
      showToast("Couldn't send: " + (err.error ?? 'unknown'), false)
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
      showToast('Changes saved')
    } else {
      const err = await res.json().catch(() => ({}))
      showToast("Couldn't save: " + (err.error ?? res.statusText), false)
    }
  }

  function toggleSection(key: string) {
    setLocalSections((prev) => {
      const updated = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      setSectionsChanged(true)
      return updated
    })
  }

  async function handleSaveSections() {
    setSectionsSaving(true)
    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dynamic_sections: localSections }),
    })
    setSectionsSaving(false)
    if (res.ok) {
      setClient((prev) => prev ? { ...prev, dynamic_sections: localSections } : prev)
      setSectionsChanged(false)
      showToast('Sections saved')
    } else {
      showToast("Couldn't save sections", false)
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
    if (res.ok) showToast('Brief saved')
    else showToast("Couldn't save the brief", false)
  }

  function downloadPDF() {
    if (!client) return
    const s = survey
    const str = (k: string) => (s[k] as string) || ''
    const arr = (k: string): string[] => Array.isArray(s[k]) ? s[k] as string[] : []

    function row(label: string, value: string) {
      if (!value?.trim()) return ''
      return `<tr>
        <td style="padding:4px 0;font-size:11px;color:#8A8A92;width:160px;vertical-align:top;">${label}</td>
        <td style="padding:4px 0;font-size:13px;color:#16161A;vertical-align:top;white-space:pre-wrap;">${value.replace(/</g,'&lt;')}</td>
      </tr>`
    }
    function sec(title: string, rows: string) {
      const content = rows.trim()
      if (!content) return ''
      return `<div style="margin-bottom:22px;page-break-inside:avoid;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8A8A92;border-bottom:1px solid #E4E1DA;padding-bottom:5px;margin-bottom:10px;">${title}</div>
        <table style="width:100%;border-collapse:collapse;">${content}</table>
      </div>`
    }

    const pages = arr('paginas')
    const fotos = arr('fotos_urls')

    const html = `<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8">
      <title>Brief — ${client.business_name}</title>
      <style>
        @page { margin: 18mm 20mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, Arial, sans-serif; color: #16161A; font-size: 13px; margin: 0; }
        @media print { .no-print { display: none; } }
      </style>
    </head><body>
      <div class="no-print" style="background:#16161A;color:#fff;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;">Press <strong>Ctrl+P</strong> / <strong>⌘P</strong> and choose &ldquo;Save as PDF&rdquo;</span>
        <button onclick="window.print()" style="background:#D46FC8;color:#FFFFFF;border:none;padding:8px 18px;border-radius:9999px;cursor:pointer;font-weight:700;font-size:13px;">Print / Save PDF</button>
      </div>
      <div style="max-width:700px;margin:28px auto;padding:0 20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:2px solid #16161A;margin-bottom:24px;">
          <div>
            <div style="font-size:22px;font-weight:700;">${client.business_name}</div>
            <div style="font-size:12px;color:#8A8A92;margin-top:3px;">
              Web design brief · ${surveyAt ? new Date(surveyAt).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'}) : new Date().toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'})}
              ${surveyCompleted ? ' · <span style="color:#1F7A55;font-weight:600;">✓ Submitted by client</span>' : ''}
            </div>
          </div>
          <div style="font-size:16px;font-weight:700;color:#16161A;">Yele Studio</div>
        </div>

        ${sec('Your business', [
          row('Description', str('descripcion_negocio')),
          row('Service 1', [str('servicio_1_nombre'), str('servicio_1_precio')].filter(Boolean).join(' — ')),
          row('Service 2', [str('servicio_2_nombre'), str('servicio_2_precio')].filter(Boolean).join(' — ')),
          row('Service 3', [str('servicio_3_nombre'), str('servicio_3_precio')].filter(Boolean).join(' — ')),
          row('Ideal client', str('cliente_ideal')),
          row('What sets them apart', str('diferenciador')),
        ].join(''))}

        ${sec('Content', [
          row('Years of experience', str('anos_experiencia')),
          row('Opening hours', str('horario')),
          row('Service area', str('zona_cobertura')),
          row('Story', str('historia')),
          row('Testimonial 1', str('testimonio_1_nombre') ? `${str('testimonio_1_nombre')} (${str('testimonio_1_ciudad')}): ${str('testimonio_1_texto')}` : ''),
          row('Testimonial 2', str('testimonio_2_nombre') ? `${str('testimonio_2_nombre')} (${str('testimonio_2_ciudad')}): ${str('testimonio_2_texto')}` : ''),
          row('Testimonial 3', str('testimonio_3_nombre') ? `${str('testimonio_3_nombre')} (${str('testimonio_3_ciudad')}): ${str('testimonio_3_texto')}` : ''),
        ].join(''))}

        ${sec('Visual identity', [
          row('Logo', str('tiene_logo')),
          row('Logo URL', str('logo_url')),
          row('Photos', str('tiene_fotos')),
          row('Photos uploaded', fotos.length ? `${fotos.length} photo(s)` : ''),
          row('Visual style', str('estilo_visual')),
          row('References', str('referencias_urls')),
          row('Brand colors', str('colores_marca')),
        ].join(''))}

        ${sec('The website', [
          row('Pages', pages.length ? pages.map((p) => PAGE_LABELS[p] ?? p).join(', ') : ''),
          row('Contact type', str('contacto_tipo')),
          // 'si' is the stored value — only the printed text is English
          row('Domain', str('tiene_dominio') === 'si' ? `Yes — ${str('dominio_actual')}` : str('tiene_dominio')),
          row('Extras', str('extras')),
        ].join(''))}

        ${sec('Contact and social', [
          row('Phone', str('telefono')),
          row('Email', str('email_contacto')),
          row('WhatsApp', str('whatsapp')),
          row('Address', str('direccion')),
          row('Instagram', str('instagram')),
          row('Facebook', str('facebook')),
          row('Google Business', str('google_business')),
        ].join(''))}

        <div style="margin-top:32px;padding-top:12px;border-top:1px solid #E4E1DA;font-size:11px;color:#8A8A92;display:flex;justify-content:space-between;">
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
          <div className="h-8 w-48 rounded-xl" style={{ backgroundColor: '#F2F0EB' }} />
          <div className="h-64 rounded-2xl" style={{ backgroundColor: '#F2F0EB' }} />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 p-6">
        <p className="text-sm" style={{ color: '#B3382B' }}>Client not found.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/clientes')}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#16161A' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A92' }}
      >
        <ArrowLeft size={15} /> Back to clients
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
            {client.business_name}
          </h1>
          <p className="yele-eyebrow mt-1.5">{client.id}</p>
        </div>
        {client.plan && (
          <span
            className="yele-pill"
            style={{ backgroundColor: '#F2F0EB', color: '#8A8A92', border: '1px solid rgba(22,22,26,0.08)' }}
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
            style={{ color: '#D46FC8', fontFamily: 'var(--font-instrument)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#8A5A16' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#D46FC8' }}
          >
            <ExternalLink size={12} /> View site
          </a>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: '#F2F0EB', width: 'fit-content' }}>
        {(['info', 'secciones', 'mensajes', 'diseno'] as Tab[]).map((t) => (
          // `t` is internal tab state, not a stored value — only the label is translated
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`yele-btn ${tab === t ? 'yele-btn-primary' : 'yele-btn-ghost'}`}
          >
            {t === 'info' ? 'Details' : t === 'secciones' ? 'Sections' : t === 'mensajes' ? 'Messages' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Palette size={12} />
                Design
                {surveyCompleted && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1F7A55', display: 'inline-block' }} />}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {tab === 'info' && (
        <div className="yele-card-quiet max-w-2xl space-y-5 p-5">
          <div>
            <p className="yele-eyebrow mb-2">Client</p>
            <h2 className="text-sm font-semibold" style={{ color: '#16161A', fontFamily: 'var(--font-display)' }}>Client details</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="yele-label">Business name</label>
              <input className="yele-input" value={form.business_name ?? ''} onChange={(e) => patch('business_name', e.target.value)} />
            </div>
            <div>
              <label className="yele-label">Email</label>
              <input className="yele-input" type="email" value={form.email ?? ''} onChange={(e) => patch('email', e.target.value)} />
            </div>
            <div>
              <label className="yele-label">Phone</label>
              <input className="yele-input" value={form.phone ?? ''} onChange={(e) => patch('phone', e.target.value)} />
            </div>
            <div>
              <label className="yele-label">City</label>
              <input className="yele-input" value={form.city ?? ''} onChange={(e) => patch('city', e.target.value)} />
            </div>
            <div>
              <label className="yele-label">Industry</label>
              <input className="yele-input" value={form.industry_type ?? ''} onChange={(e) => patch('industry_type', e.target.value)} />
            </div>
            <div>
              <label className="yele-label">Site URL</label>
              <input className="yele-input" value={form.website_url ?? ''} onChange={(e) => patch('website_url', e.target.value)} />
            </div>
            <div>
              <label className="yele-label">Plan</label>
              {/* option values stay Spanish (stored in Supabase); labels are English */}
              <select className="yele-select" value={form.plan ?? ''} onChange={(e) => patch('plan', e.target.value)}>
                {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="yele-label">Status</label>
              <select className="yele-select" value={form.status ?? ''} onChange={(e) => patch('status', e.target.value as ClientStatus)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="yele-rule" />

          <div className="flex items-center justify-between">
            <p className="yele-eyebrow">Joined {formatDate(client.created_at)}</p>
            <button className="yele-btn yele-btn-primary" onClick={handleSaveInfo} disabled={saving}>
              <Save size={13} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── SECTIONS TAB ── */}
      {tab === 'secciones' && (
        <div className="space-y-6">
          {/* Section selector */}
          <div className="yele-card-quiet p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="yele-eyebrow mb-2">{localSections.length} of {Object.keys(SECTION_CONFIG).length} on</p>
                <h2 className="text-sm font-semibold" style={{ color: '#16161A', fontFamily: 'var(--font-display)' }}>
                  Active sections
                </h2>
              </div>
              {sectionsChanged && (
                <button className="yele-btn yele-btn-primary" onClick={handleSaveSections} disabled={sectionsSaving}>
                  <Save size={13} />
                  {sectionsSaving ? 'Saving…' : 'Save sections'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SECTION_CONFIG).map(([key, cfg]) => {
                const active = localSections.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSection(key)}
                    className={`yele-btn ${active ? 'yele-btn-primary' : 'yele-btn-secondary'}`}
                  >
                    {cfg.icon}
                    {cfg.title}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section content cards */}
          {localSections.length === 0 ? (
            <div className="yele-card-quiet px-5 py-10 text-center">
              <p className="text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>
                Turn on sections above so the client can add content.
              </p>
            </div>
          ) : (
            localSections.map((sectionKey) => {
              const cfg = SECTION_CONFIG[sectionKey]
              if (!cfg) return (
                <div key={sectionKey} className="yele-card-quiet p-5">
                  <p className="yele-eyebrow">{sectionKey} — no configuration</p>
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
                  useAdminApi
                />
              )
            })
          )}
        </div>
      )}

      {/* ── MESSAGES TAB ── */}
      {tab === 'mensajes' && (
        <div
          className="yele-card-quiet max-w-2xl flex flex-col"
          style={{ overflow: 'hidden', height: '520px' }}
        >
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {msgsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: '#F2F0EB' }} />)}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>No messages yet.</p>
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
                        backgroundColor: isStudio ? '#16161A' : '#F2F0EB',
                        color: isStudio ? '#FFFFFF' : '#16161A',
                        borderRadius: isStudio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        fontFamily: 'var(--font-instrument)',
                      }}
                    >
                      {!isStudio && (
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#8A8A92', marginBottom: '2px' }}>
                          {senderName}
                        </p>
                      )}
                      <p style={{ lineHeight: '1.5' }}>{body}</p>
                      <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{formatDateTime(msg.created_at)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Reply form */}
          <div
            className="flex items-end gap-2 p-3"
            style={{ borderTop: '1px solid rgba(22,22,26,0.06)' }}
          >
            <textarea
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() } }}
              placeholder="Write a message… (Enter to send)"
              rows={2}
              className="yele-textarea"
              style={{ resize: 'none', flex: 1 }}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyInput.trim() || replySending}
              className="yele-btn yele-btn-primary"
            >
              <Send size={13} />
              {replySending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* ── DESIGN TAB ── */}
      {tab === 'diseno' && (
        <div className="space-y-4 max-w-2xl">

          {/* Status + actions bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {surveyCompleted ? (
                <span className="yele-pill"
                  style={{ backgroundColor: 'rgba(31,122,85,0.10)', color: '#1F7A55', border: '1px solid rgba(31,122,85,0.2)' }}>
                  <Check size={11} /> Submitted by client
                  {surveyAt && <span className="yele-eyebrow" style={{ marginLeft: '4px' }}>{formatDate(surveyAt)}</span>}
                </span>
              ) : (
                <span className="yele-pill"
                  style={{ backgroundColor: '#F2F0EB', color: '#8A8A92' }}>
                  Not submitted yet
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadPDF} className="yele-btn yele-btn-secondary">
                <FileDown size={13} /> Download PDF
              </button>
              <button onClick={handleSaveSurvey} disabled={surveySaving} className="yele-btn yele-btn-primary">
                <Save size={13} />
                {surveySaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── Block 1: Business ── */}
          <SurveyCard title="Your business">
            <SurveyField label="Business description">
              <SurveyTextarea value={survey['descripcion_negocio'] as string ?? ''} onChange={(v) => patchSurvey('descripcion_negocio', v)} rows={3} />
            </SurveyField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <SurveyField label="Ideal client">
                <SurveyTextarea value={survey['cliente_ideal'] as string ?? ''} onChange={(v) => patchSurvey('cliente_ideal', v)} rows={2} />
              </SurveyField>
              <SurveyField label="What sets them apart">
                <SurveyInput value={survey['diferenciador'] as string ?? ''} onChange={(v) => patchSurvey('diferenciador', v)} />
              </SurveyField>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p className="yele-eyebrow" style={{ marginBottom: '8px' }}>
                Services
              </p>
              {([1, 2, 3] as const).map((i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', marginBottom: '6px' }}>
                  <SurveyInput
                    value={survey[`servicio_${i}_nombre`] as string ?? ''}
                    onChange={(v) => patchSurvey(`servicio_${i}_nombre`, v)}
                    placeholder={`Service ${i}`}
                  />
                  <SurveyInput
                    value={survey[`servicio_${i}_precio`] as string ?? ''}
                    onChange={(v) => patchSurvey(`servicio_${i}_precio`, v)}
                    placeholder="Price"
                  />
                </div>
              ))}
            </div>
          </SurveyCard>

          {/* ── Block 2: Content ── */}
          <SurveyCard title="Real content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SurveyField label="Years of experience">
                <SurveyInput value={survey['anos_experiencia'] as string ?? ''} onChange={(v) => patchSurvey('anos_experiencia', v)} />
              </SurveyField>
              <SurveyField label="Service area">
                <SurveyInput value={survey['zona_cobertura'] as string ?? ''} onChange={(v) => patchSurvey('zona_cobertura', v)} />
              </SurveyField>
            </div>
            <SurveyField label="Opening hours" style={{ marginTop: '12px' }}>
              <SurveyInput value={survey['horario'] as string ?? ''} onChange={(v) => patchSurvey('horario', v)} />
            </SurveyField>
            <SurveyField label="Business story" style={{ marginTop: '12px' }}>
              <SurveyTextarea value={survey['historia'] as string ?? ''} onChange={(v) => patchSurvey('historia', v)} rows={3} />
            </SurveyField>
            <div style={{ marginTop: '12px' }}>
              <p className="yele-eyebrow" style={{ marginBottom: '8px' }}>
                Testimonials
              </p>
              {([1, 2, 3] as const).map((i) => (
                <div key={i} style={{ backgroundColor: '#F7F6F3', border: '1px solid rgba(22,22,26,0.06)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <SurveyInput value={survey[`testimonio_${i}_nombre`] as string ?? ''} onChange={(v) => patchSurvey(`testimonio_${i}_nombre`, v)} placeholder="Name" />
                    <SurveyInput value={survey[`testimonio_${i}_ciudad`] as string ?? ''} onChange={(v) => patchSurvey(`testimonio_${i}_ciudad`, v)} placeholder="City" />
                  </div>
                  <SurveyTextarea value={survey[`testimonio_${i}_texto`] as string ?? ''} onChange={(v) => patchSurvey(`testimonio_${i}_texto`, v)} placeholder="Testimonial text…" rows={2} />
                </div>
              ))}
            </div>
          </SurveyCard>

          {/* ── Block 3: Visual identity ── */}
          <SurveyCard title="Visual identity">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SurveyField label="Logo">
                {/* option values ('si', 'no', 'en_proceso', …) are stored in Supabase — labels only are English */}
                <SurveyPills
                  options={[{ value: 'si', label: 'Has one' }, { value: 'no', label: 'None' }, { value: 'en_proceso', label: 'In progress' }]}
                  value={survey['tiene_logo'] as string ?? ''}
                  onChange={(v) => patchSurvey('tiene_logo', v)}
                />
              </SurveyField>
              <SurveyField label="Photos">
                <SurveyPills
                  options={[{ value: 'si', label: 'Has photos' }, { value: 'no', label: 'None' }, { value: 'pronto', label: 'Coming soon' }]}
                  value={survey['tiene_fotos'] as string ?? ''}
                  onChange={(v) => patchSurvey('tiene_fotos', v)}
                />
              </SurveyField>
            </div>
            {(survey['logo_url'] || (survey['fotos_urls'] as string[] ?? []).length > 0) && (
              <div className="yele-card-quiet" style={{ marginTop: '10px', padding: '10px 12px', fontSize: '12px', color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>
                {survey['logo_url'] && <p style={{ margin: '0 0 4px' }}>Logo: <a href={survey['logo_url'] as string} target="_blank" rel="noreferrer" style={{ color: '#16161A' }}>view file</a></p>}
                {(survey['fotos_urls'] as string[] ?? []).length > 0 && <p style={{ margin: 0 }}>{(survey['fotos_urls'] as string[]).length} photo(s) uploaded</p>}
              </div>
            )}
            <SurveyField label="Visual style" style={{ marginTop: '12px' }}>
              <SurveyPills
                options={[
                  { value: 'elegante',   label: 'Elegant' },
                  { value: 'calido',     label: 'Warm' },
                  { value: 'moderno',    label: 'Modern' },
                  { value: 'artesanal',  label: 'Handcrafted' },
                  { value: 'atrevido',   label: 'Bold' },
                  { value: 'escogenos',  label: '✦ You choose' },
                ]}
                value={survey['estilo_visual'] as string ?? ''}
                onChange={(v) => patchSurvey('estilo_visual', v)}
              />
            </SurveyField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <SurveyField label="Reference sites (URLs)">
                <SurveyTextarea value={survey['referencias_urls'] as string ?? ''} onChange={(v) => patchSurvey('referencias_urls', v)} rows={2} />
              </SurveyField>
              <SurveyField label="Brand colors">
                <SurveyInput value={survey['colores_marca'] as string ?? ''} onChange={(v) => patchSurvey('colores_marca', v)} />
              </SurveyField>
            </div>
          </SurveyCard>

          {/* ── Block 4: The website ── */}
          <SurveyCard title="The website">
            <SurveyField label="Selected pages">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {/* page keys below are stored in Supabase — PAGE_LABELS supplies the English display text */}
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
                      className="yele-pill"
                      style={{
                        cursor: locked ? 'default' : 'pointer',
                        border: `1px solid ${selected ? '#D46FC8' : 'rgba(22,22,26,0.08)'}`,
                        backgroundColor: selected ? 'rgba(212,111,200,0.12)' : 'transparent',
                        color: selected ? '#D46FC8' : '#8A8A92',
                      }}
                    >
                      {selected && !locked && <Check size={10} style={{ display: 'inline', marginRight: 4 }} />}
                      {PAGE_LABELS[p] ?? p.replace('_', ' ')}
                    </button>
                  )
                })}
              </div>
            </SurveyField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <SurveyField label="Contact type">
                <SurveyPills
                  options={[{ value: 'formulario', label: 'Form' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'ambos', label: 'Both' }, { value: 'no', label: 'None' }]}
                  value={survey['contacto_tipo'] as string ?? ''}
                  onChange={(v) => patchSurvey('contacto_tipo', v)}
                />
              </SurveyField>
              <SurveyField label="Domain">
                <SurveyPills
                  options={[{ value: 'si', label: 'Has a domain' }, { value: 'no', label: 'Needs one' }]}
                  value={survey['tiene_dominio'] as string ?? ''}
                  onChange={(v) => patchSurvey('tiene_dominio', v)}
                />
                {survey['tiene_dominio'] === 'si' && (
                  <div style={{ marginTop: '6px' }}>
                    <SurveyInput value={survey['dominio_actual'] as string ?? ''} onChange={(v) => patchSurvey('dominio_actual', v)} placeholder="e.g. mybusiness.com" />
                  </div>
                )}
              </SurveyField>
            </div>
            <SurveyField label="Extras / special features" style={{ marginTop: '12px' }}>
              <SurveyTextarea value={survey['extras'] as string ?? ''} onChange={(v) => patchSurvey('extras', v)} rows={2} />
            </SurveyField>
          </SurveyCard>

          {/* ── Block 5: Contact and social ── */}
          <SurveyCard title="Contact and social">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <SurveyField label="Phone"><SurveyInput value={survey['telefono'] as string ?? ''} onChange={(v) => patchSurvey('telefono', v)} /></SurveyField>
              <SurveyField label="Contact email"><SurveyInput value={survey['email_contacto'] as string ?? ''} onChange={(v) => patchSurvey('email_contacto', v)} /></SurveyField>
              <SurveyField label="WhatsApp"><SurveyInput value={survey['whatsapp'] as string ?? ''} onChange={(v) => patchSurvey('whatsapp', v)} /></SurveyField>
              <SurveyField label="Address"><SurveyInput value={survey['direccion'] as string ?? ''} onChange={(v) => patchSurvey('direccion', v)} /></SurveyField>
              <SurveyField label="Instagram"><SurveyInput value={survey['instagram'] as string ?? ''} onChange={(v) => patchSurvey('instagram', v)} /></SurveyField>
              <SurveyField label="Facebook"><SurveyInput value={survey['facebook'] as string ?? ''} onChange={(v) => patchSurvey('facebook', v)} /></SurveyField>
            </div>
            <SurveyField label="Google Business" style={{ marginTop: '12px' }}>
              <SurveyInput value={survey['google_business'] as string ?? ''} onChange={(v) => patchSurvey('google_business', v)} placeholder="https://maps.google.com/…" />
            </SurveyField>
          </SurveyCard>

          {/* Bottom save */}
          <div className="flex justify-end pb-8">
            <button onClick={handleSaveSurvey} disabled={surveySaving} className="yele-btn yele-btn-primary">
              <Save size={13} />
              {surveySaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{
            backgroundColor: toast.ok ? 'rgba(31,122,85,0.08)' : 'rgba(153,27,27,0.08)',
            border: `1px solid ${toast.ok ? 'rgba(31,122,85,0.2)' : 'rgba(153,27,27,0.2)'}`,
            color: toast.ok ? '#1F7A55' : '#B3382B',
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
    <div className="yele-card-quiet" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#16161A', marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function SurveyField({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label className="yele-label">
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
      className="yele-input"
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
      className="yele-textarea"
      style={{ resize: 'vertical' }}
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
            className="yele-pill"
            style={{
              cursor: 'pointer',
              border: `1px solid ${sel ? '#D46FC8' : 'rgba(22,22,26,0.08)'}`,
              backgroundColor: sel ? 'rgba(212,111,200,0.12)' : '#FFFFFF',
              color: sel ? '#D46FC8' : '#8A8A92',
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
