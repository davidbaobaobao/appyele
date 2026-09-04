'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import { ChevronDown, ChevronUp, Check, Upload, Palette } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Survey {
  // Block 1
  descripcion_negocio: string
  servicio_1_nombre: string; servicio_1_precio: string
  servicio_2_nombre: string; servicio_2_precio: string
  servicio_3_nombre: string; servicio_3_precio: string
  cliente_ideal: string
  diferenciador: string
  // Block 2
  anos_experiencia: string
  horario: string
  zona_cobertura: string
  historia: string
  testimonio_1_nombre: string; testimonio_1_ciudad: string; testimonio_1_texto: string
  testimonio_2_nombre: string; testimonio_2_ciudad: string; testimonio_2_texto: string
  testimonio_3_nombre: string; testimonio_3_ciudad: string; testimonio_3_texto: string
  // Block 3
  tiene_logo: string
  logo_url: string
  tiene_fotos: string
  fotos_urls: string[]
  estilo_visual: string
  referencias_urls: string
  colores_marca: string
  // Block 4
  paginas: string[]
  contacto_tipo: string
  tiene_dominio: string
  dominio_actual: string
  extras: string
  // Block 5
  telefono: string
  email_contacto: string
  direccion: string
  whatsapp: string
  instagram: string
  facebook: string
  google_business: string
}

const EMPTY_SURVEY: Survey = {
  descripcion_negocio: '', servicio_1_nombre: '', servicio_1_precio: '',
  servicio_2_nombre: '', servicio_2_precio: '', servicio_3_nombre: '', servicio_3_precio: '',
  cliente_ideal: '', diferenciador: '', anos_experiencia: '', horario: '', zona_cobertura: '',
  historia: '', testimonio_1_nombre: '', testimonio_1_ciudad: '', testimonio_1_texto: '',
  testimonio_2_nombre: '', testimonio_2_ciudad: '', testimonio_2_texto: '',
  testimonio_3_nombre: '', testimonio_3_ciudad: '', testimonio_3_texto: '',
  tiene_logo: '', logo_url: '', tiene_fotos: '', fotos_urls: [], estilo_visual: '',
  referencias_urls: '', colores_marca: '', paginas: [], contacto_tipo: '',
  tiene_dominio: '', dominio_actual: '', extras: '', telefono: '', email_contacto: '',
  direccion: '', whatsapp: '', instagram: '', facebook: '', google_business: '',
}

const REQUIRED_FIELDS: (keyof Survey)[] = [
  'descripcion_negocio', 'servicio_1_nombre', 'cliente_ideal', 'diferenciador',
  'tiene_logo', 'tiene_fotos', 'estilo_visual', 'paginas', 'contacto_tipo',
  'telefono', 'email_contacto',
]

// ─── CSS tokens (light theme) ─────────────────────────────────────────────────

const AMBER  = '#D46FC8'
const MIST   = '#8A8A92'
const INK    = '#16161A'
const BORDER = 'rgba(22,22,26,0.08)'
const BG_CARD = '#FFFFFF'
const GREEN  = '#1F7A55'
const HINT   = 'rgba(22,22,26,0.45)'

// ─── Reusable primitives ──────────────────────────────────────────────────────

function FocusInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      className="yele-input"
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function FocusTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value} placeholder={placeholder} rows={rows}
      className="yele-textarea"
      style={{ resize: 'vertical' }}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: '20px' }}>
      <label className="yele-label">
        {label}{required && <span style={{ color: AMBER, marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '12px', color: HINT, marginTop: '5px', fontFamily: 'var(--font-instrument)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function PillButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`yele-btn ${selected ? 'yele-btn-accent' : 'yele-btn-secondary'}`}
    >
      {label}
    </button>
  )
}

function CollapsibleBlock({ number, title, subtitle, isOpen, onToggle, isComplete, children }: {
  number: number; title: string; subtitle: string
  isOpen: boolean; onToggle: () => void; isComplete: boolean; children: React.ReactNode
}) {
  return (
    <div
      className="yele-card"
      style={{
        marginBottom: '10px', overflow: 'hidden',
        boxShadow: isComplete
          ? '0 0 0 1px rgba(31,122,85,0.28), 0 10px 32px rgba(22,22,26,0.05)'
          : undefined,
      }}
    >
      <button
        type="button" onClick={onToggle}
        style={{
          width: '100%', padding: '18px 22px', display: 'flex',
          alignItems: 'center', gap: '14px', background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: isComplete ? 'rgba(31,122,85,0.10)' : 'rgba(212,111,200,0.10)',
          color: isComplete ? GREEN : AMBER,
          fontSize: isComplete ? '13px' : '12px', fontWeight: 700,
        }}>
          {isComplete ? <Check size={14} strokeWidth={2.5} /> : number}
        </div>
        <div style={{ flex: 1 }}>
          <div className="yele-eyebrow" style={{ marginBottom: '6px' }}>
            Step {number} of 5
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: INK, fontFamily: 'var(--font-display)' }}>
            {title}
          </div>
          <div style={{ fontSize: '12px', color: MIST, marginTop: '2px', fontFamily: 'var(--font-instrument)' }}>
            {subtitle}
          </div>
        </div>
        <div style={{ color: MIST }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '0 22px 22px', borderTop: `1px solid ${BORDER}` }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DisenoPagina() {
  const [clientId, setClientId]   = useState<string | null>(null)
  const [clientSlug, setClientSlug] = useState<string>('')
  const [status, setStatus]       = useState<string>('')
  const [survey, setSurvey]       = useState<Survey>(EMPTY_SURVEY)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [openBlock, setOpenBlock] = useState(1)
  const [loading, setLoading]     = useState(true)
  const [uploadingLogo, setUploadingLogo]   = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const userId = useRef<string>('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      userId.current = user.id

      const { data: client } = await supabase
        .from('clients')
        .select('id, slug, status, design_survey, design_survey_completed')
        .eq('user_id', user.id)
        .single()

      if (client) {
        setClientId(client.id)
        setClientSlug(client.slug ?? '')
        setStatus(client.status ?? '')
        if (client.design_survey && Object.keys(client.design_survey).length > 0) {
          setSurvey({ ...EMPTY_SURVEY, ...client.design_survey })
        }
        if (client.design_survey_completed) setSubmitted(true)
      }
      setLoading(false)
    }
    init()
  }, [])

  const saveSurvey = useCallback(async (data: Survey) => {
    if (!userId.current) return
    setSaving(true)
    await supabase
      .from('clients')
      .update({ design_survey: data })
      .eq('user_id', userId.current)
    setSaving(false)
    setLastSaved(new Date())
  }, [])

  function updateField(key: keyof Survey, value: Survey[keyof Survey]) {
    const updated = { ...survey, [key]: value }
    setSurvey(updated)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveSurvey(updated), 1500)
  }

  const progress = Math.round(
    (REQUIRED_FIELDS.filter((f) => {
      const val = survey[f]
      return Array.isArray(val) ? val.length > 0 : !!val
    }).length / REQUIRED_FIELDS.length) * 100
  )

  // Block completeness checks
  const block1Complete = !!(survey.descripcion_negocio && survey.servicio_1_nombre && survey.cliente_ideal && survey.diferenciador)
  const block2Complete = !!(survey.anos_experiencia || survey.horario || survey.zona_cobertura)
  const block3Complete = !!(survey.tiene_logo && survey.tiene_fotos && survey.estilo_visual)
  const block4Complete = !!(survey.paginas.length > 0 && survey.contacto_tipo && survey.tiene_dominio)
  const block5Complete = !!(survey.telefono && survey.email_contacto)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !clientSlug) return
    setUploadingLogo(true)
    const path = `${clientSlug}/logo/${file.name}`
    await supabase.storage.from('client-assets').upload(path, file, { upsert: true })
    const { data: urlData } = supabase.storage.from('client-assets').getPublicUrl(path)
    if (urlData?.publicUrl) updateField('logo_url', urlData.publicUrl)
    setUploadingLogo(false)
  }

  async function handlePhotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10)
    if (!files.length || !clientSlug) return
    setUploadingPhotos(true)
    const urls: string[] = []
    for (const file of files) {
      const path = `${clientSlug}/fotos/${Date.now()}-${file.name}`
      await supabase.storage.from('client-assets').upload(path, file)
      const { data: urlData } = supabase.storage.from('client-assets').getPublicUrl(path)
      if (urlData?.publicUrl) urls.push(urlData.publicUrl)
    }
    updateField('fotos_urls', [...(survey.fotos_urls ?? []), ...urls])
    setUploadingPhotos(false)
  }

  async function handleSubmit() {
    if (!userId.current || !clientId) return
    setSubmitting(true)
    const now = new Date().toISOString()
    await supabase
      .from('clients')
      .update({ design_survey: survey, design_survey_submitted_at: now, design_survey_completed: true })
      .eq('user_id', userId.current)

    await fetch('/api/design-survey-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ survey, clientId }),
    })

    setSubmitted(true)
    setSubmitting(false)
  }

  // ── Access guard ───────────────────────────────────────────────────────────

  if (!loading && status && status !== 'building' && status !== 'revision') {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        <Sidebar />
        <main className="flex-1 flex flex-col dashboard-main">
          <TopBar title="Design" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Palette size={32} style={{ color: 'rgba(22,22,26,0.25)', margin: '0 auto 12px' }} />
              <p style={{ fontFamily: 'var(--font-instrument)', color: MIST, fontSize: '14px' }}>
                This section opens once your project reaches the design phase.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Submitted state ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        <Sidebar />
        <main className="flex-1 flex flex-col dashboard-main">
          <TopBar title="Design" />
          <div className="flex-1 flex items-center justify-center px-6">
            <div style={{ textAlign: 'center', maxWidth: '420px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: 'rgba(31,122,85,0.10)', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={28} style={{ color: GREEN }} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: INK, marginBottom: '12px' }}>
                Brief sent
              </h2>
              <p style={{ fontFamily: 'var(--font-instrument)', color: MIST, fontSize: '14px', lineHeight: 1.65 }}>
                We have everything we need. Expect a message within 24 hours to confirm the details and start the design.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main" style={{ height: '100vh' }}>
        <TopBar title="Design" />

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-3 animate-pulse w-full max-w-2xl mx-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: '#F2F0EB' }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>

              {/* Header */}
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: INK, margin: '0 0 6px' }}>
                  Your website design
                </h1>
                <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '14px', color: MIST, margin: 0 }}>
                  Fill in this brief so we can design your site exactly the way you want it.
                </p>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="yele-eyebrow">
                    Brief progress
                  </span>
                  <span className="yele-eyebrow" style={{ color: progress === 100 ? GREEN : undefined }}>
                    {progress}% complete
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#F2F0EB', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '3px', backgroundColor: AMBER, width: `${progress}%`, transition: 'width 0.4s ease' }} />
                </div>
                {saving && (
                  <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '11px', color: HINT, marginTop: '6px' }}>
                    Saving…
                  </p>
                )}
                {lastSaved && !saving && (
                  <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '11px', color: HINT, marginTop: '6px' }}>
                    ✓ Saved automatically
                  </p>
                )}
              </div>

              {/* ── BLOCK 1 — YOUR BUSINESS ── */}
              <CollapsibleBlock number={1} title="Your business"
                subtitle="What we need to understand before we design"
                isOpen={openBlock === 1} onToggle={() => setOpenBlock(openBlock === 1 ? 0 : 1)}
                isComplete={block1Complete}
              >
                <Field label="How would you describe your business?" required
                  hint="1-2 sentences. e.g. I am a plumber in Barcelona specializing in emergency callouts.">
                  <FocusTextarea value={survey.descripcion_negocio}
                    onChange={(v) => updateField('descripcion_negocio', v)}
                    placeholder="Describe your business in a few words…" rows={3} />
                </Field>

                <div style={{ marginTop: '20px' }}>
                  <label className="yele-label" style={{ marginBottom: '2px' }}>
                    Main services<span style={{ color: AMBER }}>*</span>
                  </label>
                  <p style={{ fontSize: '12px', color: HINT, marginBottom: '8px', fontFamily: 'var(--font-instrument)' }}>
                    Up to 3 services. Add a price if you want it shown.
                  </p>
                  {([1, 2, 3] as const).map((i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px', marginBottom: '8px' }}>
                      <FocusInput
                        value={survey[`servicio_${i}_nombre` as keyof Survey] as string}
                        onChange={(v) => updateField(`servicio_${i}_nombre` as keyof Survey, v)}
                        placeholder={i === 1 ? 'e.g. Emergency repairs' : i === 2 ? 'e.g. Bathroom installation' : 'e.g. Annual servicing'}
                      />
                      <FocusInput
                        value={survey[`servicio_${i}_precio` as keyof Survey] as string}
                        onChange={(v) => updateField(`servicio_${i}_precio` as keyof Survey, v)}
                        placeholder="e.g. €60/hr"
                      />
                    </div>
                  ))}
                </div>

                <Field label="Who is your ideal customer?" required
                  hint="e.g. Homeowners looking for a plumber they can trust.">
                  <FocusTextarea value={survey.cliente_ideal}
                    onChange={(v) => updateField('cliente_ideal', v)}
                    placeholder="Describe your ideal customer…" rows={2} />
                </Field>

                <Field label="What sets you apart from the competition?" required
                  hint="e.g. I answer within 2 hours and quotes are free.">
                  <FocusInput value={survey.diferenciador}
                    onChange={(v) => updateField('diferenciador', v)}
                    placeholder="What makes you different…" />
                </Field>
              </CollapsibleBlock>

              {/* ── BLOCK 2 — REAL CONTENT ── */}
              <CollapsibleBlock number={2} title="Real content"
                subtitle="The words and details that will go on your site"
                isOpen={openBlock === 2} onToggle={() => setOpenBlock(openBlock === 2 ? 0 : 2)}
                isComplete={block2Complete}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  <Field label="Years of experience">
                    <FocusInput value={survey.anos_experiencia}
                      onChange={(v) => updateField('anos_experiencia', v)} placeholder="e.g. 12" />
                  </Field>
                  <Field label="Service area">
                    <FocusInput value={survey.zona_cobertura}
                      onChange={(v) => updateField('zona_cobertura', v)} placeholder="e.g. Barcelona and surrounding area" />
                  </Field>
                </div>

                <Field label="Opening hours" hint="e.g. Monday to Friday 8:00-20:00, Saturday 9:00-14:00">
                  <FocusInput value={survey.horario}
                    onChange={(v) => updateField('horario', v)} placeholder="Your opening hours…" />
                </Field>

                <Field label="Your story (optional)" hint="Tell us how you started. It gives your brand a human face.">
                  <FocusTextarea value={survey.historia}
                    onChange={(v) => updateField('historia', v)}
                    placeholder="Briefly, how and why did you start this business?" rows={3} />
                </Field>

                <div style={{ marginTop: '20px' }}>
                  <label className="yele-label">
                    Customer testimonials
                  </label>
                  <p style={{ fontSize: '12px', color: HINT, margin: '2px 0 12px', fontFamily: 'var(--font-instrument)' }}>
                    Optional. If you have none, we will draft them from your profile.
                  </p>
                  {([1, 2, 3] as const).map((i) => (
                    <div key={i} className="yele-card-quiet" style={{ padding: '14px', marginBottom: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <FocusInput
                          value={survey[`testimonio_${i}_nombre` as keyof Survey] as string}
                          onChange={(v) => updateField(`testimonio_${i}_nombre` as keyof Survey, v)}
                          placeholder="Customer name"
                        />
                        <FocusInput
                          value={survey[`testimonio_${i}_ciudad` as keyof Survey] as string}
                          onChange={(v) => updateField(`testimonio_${i}_ciudad` as keyof Survey, v)}
                          placeholder="City"
                        />
                      </div>
                      <FocusTextarea
                        value={survey[`testimonio_${i}_texto` as keyof Survey] as string}
                        onChange={(v) => updateField(`testimonio_${i}_texto` as keyof Survey, v)}
                        placeholder={`"${i === 1 ? 'Great service, professional and fast.' : i === 2 ? 'I recommend them to everyone I know.' : 'Fixed the problem in under an hour.'}"`}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleBlock>

              {/* ── BLOCK 3 — VISUAL IDENTITY ── */}
              <CollapsibleBlock number={3} title="Visual identity"
                subtitle="So the design reflects how you want to be seen"
                isOpen={openBlock === 3} onToggle={() => setOpenBlock(openBlock === 3 ? 0 : 3)}
                isComplete={block3Complete}
              >
                {/* Logo */}
                <Field label="Do you have a logo?" required>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {[{ value: 'si', label: 'Yes, I have one' }, { value: 'no', label: 'I do not have one' }, { value: 'en_proceso', label: 'In progress' }].map((opt) => (
                      <PillButton key={opt.value} label={opt.label}
                        selected={survey.tiene_logo === opt.value}
                        onClick={() => updateField('tiene_logo', opt.value)} />
                    ))}
                  </div>
                  {survey.tiene_logo === 'si' && (
                    <label style={{ display: 'block', marginTop: '10px', border: `1px dashed ${BORDER}`, borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                      <Upload size={18} style={{ color: MIST, margin: '0 auto 6px', display: 'block' }} />
                      <p style={{ fontSize: '12px', color: MIST, margin: 0, fontFamily: 'var(--font-instrument)' }}>
                        {uploadingLogo ? 'Uploading…' : survey.logo_url ? '✓ Logo uploaded — click to replace' : 'Upload your logo (SVG or PNG with a transparent background)'}
                      </p>
                      <input type="file" accept=".svg,.png" style={{ display: 'none' }}
                        onChange={handleLogoUpload} />
                    </label>
                  )}
                </Field>

                {/* Photos */}
                <Field label="Do you have photos of your business?" required>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {[{ value: 'si', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'pronto', label: 'Taking them soon' }].map((opt) => (
                      <PillButton key={opt.value} label={opt.label}
                        selected={survey.tiene_fotos === opt.value}
                        onClick={() => updateField('tiene_fotos', opt.value)} />
                    ))}
                  </div>
                  {survey.tiene_fotos === 'si' && (
                    <label style={{ display: 'block', marginTop: '10px', border: `1px dashed ${BORDER}`, borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                      <Upload size={18} style={{ color: MIST, margin: '0 auto 6px', display: 'block' }} />
                      <p style={{ fontSize: '12px', color: MIST, margin: 0, fontFamily: 'var(--font-instrument)' }}>
                        {uploadingPhotos ? 'Uploading…' : survey.fotos_urls?.length > 0 ? `✓ ${survey.fotos_urls.length} photo(s) uploaded — add more` : 'Upload up to 10 photos (JPG or PNG)'}
                      </p>
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={handlePhotosUpload} />
                    </label>
                  )}
                </Field>

                {/* Visual style card selector */}
                <Field label="Which visual style feels like you?" required>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                    {[
                      { value: 'elegante', label: 'Elegant and minimal',  colors: ['#1A1A1A', '#2A2A2A', '#F2F0EB', '#C4A070'] },
                      { value: 'calido',   label: 'Warm and welcoming',   colors: ['#3A1A0A', '#8A3A18', '#F7F0F5', '#D4A020'] },
                      { value: 'moderno',  label: 'Modern and technical', colors: ['#1A2A4A', '#2A4A7A', '#F2F0EB', '#3A90D0'] },
                      { value: 'artesanal',label: 'Classic and crafted',  colors: ['#2A1A0A', '#5A3A18', '#F7F0F5', '#4A6A30'] },
                      { value: 'atrevido', label: 'Bold and striking',    colors: ['#1A1A2A', '#2A2A4A', '#F7F6F3', '#E040A0'] },
                      { value: 'escogenos',label: 'Choose for me',        colors: ['#0D0E12', '#16171C', '#F2F0EB', '#D46FC8'], special: true },
                    ].map((style) => {
                      const sel = survey.estilo_visual === style.value
                      return (
                        <button key={style.value} type="button"
                          onClick={() => updateField('estilo_visual', style.value)}
                          style={{
                            borderRadius: '10px', padding: 0, cursor: 'pointer', overflow: 'hidden',
                            border: `2px solid ${sel ? AMBER : BORDER}`,
                            backgroundColor: sel ? 'rgba(212,111,200,0.04)' : BG_CARD,
                            transition: 'border-color 0.15s',
                          }}
                        >
                          <div style={{ height: '44px', display: 'flex' }}>
                            {style.colors.map((c, i) => <div key={i} style={{ flex: 1, backgroundColor: c }} />)}
                          </div>
                          <div style={{
                            padding: '8px 6px', fontSize: '11px', lineHeight: 1.3, textAlign: 'center',
                            color: sel ? AMBER : (style.special ? AMBER : MIST),
                            fontFamily: 'var(--font-instrument)',
                            fontWeight: style.special || sel ? 600 : 400,
                          }}>
                            {style.special && '✦ '}{style.label}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {survey.estilo_visual === 'escogenos' && (
                    <div style={{ marginTop: '10px', padding: '12px 16px', backgroundColor: 'rgba(212,111,200,0.06)', border: `1px solid rgba(212,111,200,0.2)`, borderRadius: '8px', fontSize: '12px', color: AMBER, fontFamily: 'var(--font-instrument)' }}>
                      ✦ Great. We will pick the style that best fits your industry, your city and your brand personality.
                    </div>
                  )}
                </Field>

                <Field label="Reference sites (optional)" hint="URLs of sites you like. They do not have to be in your industry.">
                  <FocusTextarea value={survey.referencias_urls}
                    onChange={(v) => updateField('referencias_urls', v)}
                    placeholder={'https://example1.com\nhttps://example2.com'} rows={3} />
                </Field>

                <Field label="Do you have brand colors?" hint="If you already use specific colors, tell us which.">
                  <FocusInput value={survey.colores_marca}
                    onChange={(v) => updateField('colores_marca', v)}
                    placeholder="e.g. Navy and white, or a hex code" />
                </Field>
              </CollapsibleBlock>

              {/* ── BLOCK 4 — THE WEBSITE ── */}
              <CollapsibleBlock number={4} title="The website"
                subtitle="Which pages and features you need"
                isOpen={openBlock === 4} onToggle={() => setOpenBlock(openBlock === 4 ? 0 : 4)}
                isComplete={block4Complete}
              >
                <Field label="Which pages do you want?" required>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                    {[
                      { value: 'inicio',    label: 'Home',                 locked: true },
                      { value: 'servicios', label: 'Services' },
                      { value: 'sobre_mi',  label: 'About me / us' },
                      { value: 'galeria',   label: 'Showcase' },
                      { value: 'blog',      label: 'Blog' },
                      { value: 'precios',   label: 'Pricing' },
                      { value: 'contacto',  label: 'Contact' },
                      { value: 'reservas',  label: 'Online booking' },
                      { value: 'tienda',    label: 'Store' },
                      { value: 'otro',      label: 'Another page' },
                    ].map((page) => {
                      const isSelected = survey.paginas.includes(page.value) || !!page.locked
                      return (
                        <button key={page.value} type="button"
                          disabled={!!page.locked}
                          onClick={() => {
                            const updated = survey.paginas.includes(page.value)
                              ? survey.paginas.filter((p) => p !== page.value)
                              : [...survey.paginas, page.value]
                            updateField('paginas', updated)
                          }}
                          style={{
                            padding: '10px 14px', borderRadius: '7px', textAlign: 'left',
                            border: `1px solid ${isSelected ? AMBER : BORDER}`,
                            backgroundColor: isSelected ? 'rgba(212,111,200,0.06)' : 'transparent',
                            color: page.locked ? AMBER : isSelected ? AMBER : MIST,
                            fontSize: '13px', cursor: page.locked ? 'default' : 'pointer',
                            fontFamily: 'var(--font-instrument)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}
                        >
                          {isSelected && <Check size={12} />}
                          {page.label}
                          {page.locked && <span style={{ fontSize: '10px', color: HINT, marginLeft: 'auto' }}>always included</span>}
                        </button>
                      )
                    })}
                  </div>
                </Field>

                <Field label="How should people get in touch?" required>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {[
                      { value: 'formulario', label: 'Contact form' },
                      { value: 'whatsapp',   label: 'WhatsApp button' },
                      { value: 'ambos',      label: 'Both' },
                      { value: 'no',         label: 'Not for now' },
                    ].map((opt) => (
                      <PillButton key={opt.value} label={opt.label}
                        selected={survey.contacto_tipo === opt.value}
                        onClick={() => updateField('contacto_tipo', opt.value)} />
                    ))}
                  </div>
                </Field>

                <Field label="Do you have your own domain?" required>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {[{ value: 'si', label: 'Yes' }, { value: 'no', label: 'I need one' }].map((opt) => (
                      <PillButton key={opt.value} label={opt.label}
                        selected={survey.tiene_dominio === opt.value}
                        onClick={() => updateField('tiene_dominio', opt.value)} />
                    ))}
                  </div>
                  {survey.tiene_dominio === 'si' && (
                    <div style={{ marginTop: '8px' }}>
                      <FocusInput value={survey.dominio_actual}
                        onChange={(v) => updateField('dominio_actual', v)} placeholder="e.g. mybusiness.com" />
                    </div>
                  )}
                </Field>

                <Field label="Anything special you want included?" hint="e.g. Quote calculator, booking area, live chat…">
                  <FocusTextarea value={survey.extras}
                    onChange={(v) => updateField('extras', v)}
                    placeholder="Tell us about any special features you need…" rows={2} />
                </Field>
              </CollapsibleBlock>

              {/* ── BLOCK 5 — CONTACT AND SOCIAL ── */}
              <CollapsibleBlock number={5} title="Contact and social"
                subtitle="For the footer and the contact section of your site"
                isOpen={openBlock === 5} onToggle={() => setOpenBlock(openBlock === 5 ? 0 : 5)}
                isComplete={block5Complete}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  <Field label="Phone" required>
                    <FocusInput type="tel" value={survey.telefono}
                      onChange={(v) => updateField('telefono', v)} placeholder="e.g. 612 345 678" />
                  </Field>
                  <Field label="Contact email" required>
                    <FocusInput type="email" value={survey.email_contacto}
                      onChange={(v) => updateField('email_contacto', v)} placeholder="e.g. hello@mybusiness.com" />
                  </Field>
                  <Field label="WhatsApp">
                    <FocusInput type="tel" value={survey.whatsapp}
                      onChange={(v) => updateField('whatsapp', v)} placeholder="e.g. +34 612 345 678" />
                  </Field>
                  <Field label="Street address (if any)">
                    <FocusInput value={survey.direccion}
                      onChange={(v) => updateField('direccion', v)} placeholder="e.g. 12 Calle Mayor, Barcelona" />
                  </Field>
                  <Field label="Instagram">
                    <FocusInput value={survey.instagram}
                      onChange={(v) => updateField('instagram', v)} placeholder="@yourbusiness" />
                  </Field>
                  <Field label="Facebook (optional)">
                    <FocusInput value={survey.facebook}
                      onChange={(v) => updateField('facebook', v)} placeholder="facebook.com/yourbusiness" />
                  </Field>
                </div>
                <Field label="Google Business (if you have a listing)" hint="The URL of your Google Maps profile.">
                  <FocusInput value={survey.google_business}
                    onChange={(v) => updateField('google_business', v)} placeholder="https://maps.google.com/…" />
                </Field>
              </CollapsibleBlock>

              {/* ── Submit ── */}
              {progress >= 70 && (
                <div style={{ marginTop: '28px', marginBottom: '48px' }}>
                  {progress < 100 && (
                    <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: MIST, marginBottom: '12px', textAlign: 'center' }}>
                      You can send now, or fill in more fields first.
                    </p>
                  )}
                  <button
                    type="button" onClick={handleSubmit} disabled={submitting}
                    className="yele-btn yele-btn-primary"
                    style={{ width: '100%', height: '52px', fontSize: '14px' }}
                  >
                    {submitting ? 'Sending…' : 'Send brief to Yele Studio'}
                  </button>
                  <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '11px', color: HINT, textAlign: 'center', marginTop: '10px' }}>
                    We will get back to you within 24 hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
