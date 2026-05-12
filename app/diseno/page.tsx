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

const AMBER  = '#E8A020'
const MIST   = '#86868B'
const INK    = '#1D1D1F'
const BORDER = 'rgba(0,0,0,0.08)'
const BG_SUB = '#FAFAFA'
const BG_CARD = '#FFFFFF'
const GREEN  = '#2A8A5A'

// ─── Reusable primitives ──────────────────────────────────────────────────────

function inputStyle(focused?: boolean): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box',
    backgroundColor: '#F5F5F7',
    border: `1px solid ${focused ? AMBER : BORDER}`,
    borderRadius: '8px', color: INK, fontSize: '14px',
    padding: '10px 14px', outline: 'none',
    fontFamily: 'var(--font-instrument)',
    transition: 'border-color 0.15s',
  }
}

function FocusInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      style={inputStyle(focused)}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function FocusTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value} placeholder={placeholder} rows={rows}
      style={{ ...inputStyle(focused), resize: 'vertical' }}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: '20px' }}>
      <label style={{
        display: 'block', fontSize: '11px', fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase' as const,
        color: MIST, marginBottom: '6px', fontFamily: 'var(--font-instrument)',
      }}>
        {label}{required && <span style={{ color: AMBER, marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '11px', color: '#C7C7CC', marginTop: '4px', fontFamily: 'var(--font-instrument)' }}>
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
      style={{
        padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
        border: `1px solid ${selected ? AMBER : BORDER}`,
        backgroundColor: selected ? 'rgba(232,160,32,0.08)' : 'transparent',
        color: selected ? AMBER : MIST,
        fontSize: '13px', fontFamily: 'var(--font-instrument)',
        transition: 'all 0.15s',
      }}
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
    <div style={{
      border: `1px solid ${isComplete ? 'rgba(42,138,90,0.25)' : BORDER}`,
      borderRadius: '12px', marginBottom: '10px', overflow: 'hidden',
      backgroundColor: BG_CARD,
    }}>
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
          backgroundColor: isComplete ? 'rgba(42,138,90,0.1)' : 'rgba(232,160,32,0.1)',
          color: isComplete ? GREEN : AMBER,
          fontSize: isComplete ? '13px' : '12px', fontWeight: 700,
        }}>
          {isComplete ? <Check size={14} strokeWidth={2.5} /> : number}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: INK, fontFamily: 'var(--font-outfit)' }}>
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
          <TopBar title="Diseño" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Palette size={32} style={{ color: '#D1D1D6', margin: '0 auto 12px' }} />
              <p style={{ fontFamily: 'var(--font-instrument)', color: MIST, fontSize: '14px' }}>
                Esta sección estará disponible cuando tu proyecto esté en fase de diseño.
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
          <TopBar title="Diseño" />
          <div className="flex-1 flex items-center justify-center px-6">
            <div style={{ textAlign: 'center', maxWidth: '420px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: 'rgba(42,138,90,0.1)', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={28} style={{ color: GREEN }} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: '24px', fontWeight: 700, color: INK, marginBottom: '12px' }}>
                Briefing enviado
              </h2>
              <p style={{ fontFamily: 'var(--font-instrument)', color: MIST, fontSize: '14px', lineHeight: 1.65 }}>
                Hemos recibido toda la información. Te contactaremos en menos de 24 horas para confirmar los detalles y empezar con el diseño.
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
        <TopBar title="Diseño" />

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-3 animate-pulse w-full max-w-2xl mx-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: '#F5F5F7' }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>

              {/* Header */}
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: '26px', fontWeight: 700, color: INK, margin: '0 0 6px' }}>
                  Diseño de tu web
                </h1>
                <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '14px', color: MIST, margin: 0 }}>
                  Completa este briefing para que podamos diseñar tu web exactamente como quieres.
                </p>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: MIST }}>
                    Progreso del briefing
                  </span>
                  <span style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', fontWeight: 600, color: progress === 100 ? GREEN : MIST }}>
                    {progress}% completado
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#F5F5F7', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '3px', backgroundColor: AMBER, width: `${progress}%`, transition: 'width 0.4s ease' }} />
                </div>
                {saving && (
                  <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '11px', color: '#C7C7CC', marginTop: '6px' }}>
                    Guardando…
                  </p>
                )}
                {lastSaved && !saving && (
                  <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '11px', color: '#C7C7CC', marginTop: '6px' }}>
                    ✓ Guardado automáticamente
                  </p>
                )}
              </div>

              {/* ── BLOCK 1 — TU NEGOCIO ── */}
              <CollapsibleBlock number={1} title="Tu negocio"
                subtitle="Lo que necesitamos entender antes de diseñar"
                isOpen={openBlock === 1} onToggle={() => setOpenBlock(openBlock === 1 ? 0 : 1)}
                isComplete={block1Complete}
              >
                <Field label="¿Cómo describes tu negocio?" required
                  hint="1-2 frases. ej: Soy fontanero en Barcelona, especializado en urgencias.">
                  <FocusTextarea value={survey.descripcion_negocio}
                    onChange={(v) => updateField('descripcion_negocio', v)}
                    placeholder="Describe tu negocio en pocas palabras…" rows={3} />
                </Field>

                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MIST, marginBottom: '4px', fontFamily: 'var(--font-instrument)' }}>
                    Servicios principales<span style={{ color: AMBER }}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#C7C7CC', marginBottom: '8px', fontFamily: 'var(--font-instrument)' }}>
                    Hasta 3 servicios. Añade el precio si quieres mostrarlo.
                  </p>
                  {([1, 2, 3] as const).map((i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px', marginBottom: '8px' }}>
                      <FocusInput
                        value={survey[`servicio_${i}_nombre` as keyof Survey] as string}
                        onChange={(v) => updateField(`servicio_${i}_nombre` as keyof Survey, v)}
                        placeholder={i === 1 ? 'ej. Reparación urgente' : i === 2 ? 'ej. Instalación de baños' : 'ej. Revisiones anuales'}
                      />
                      <FocusInput
                        value={survey[`servicio_${i}_precio` as keyof Survey] as string}
                        onChange={(v) => updateField(`servicio_${i}_precio` as keyof Survey, v)}
                        placeholder="ej. €60/h"
                      />
                    </div>
                  ))}
                </div>

                <Field label="¿Quién es tu cliente ideal?" required
                  hint="ej: Familias con vivienda propia que necesitan un fontanero de confianza.">
                  <FocusTextarea value={survey.cliente_ideal}
                    onChange={(v) => updateField('cliente_ideal', v)}
                    placeholder="Describe a tu cliente ideal…" rows={2} />
                </Field>

                <Field label="¿Qué te diferencia de tu competencia?" required
                  hint="ej: Respondo en 2 horas y doy presupuesto gratuito.">
                  <FocusInput value={survey.diferenciador}
                    onChange={(v) => updateField('diferenciador', v)}
                    placeholder="Tu principal diferenciador…" />
                </Field>
              </CollapsibleBlock>

              {/* ── BLOCK 2 — CONTENIDO REAL ── */}
              <CollapsibleBlock number={2} title="Contenido real"
                subtitle="Los textos e información que irán en tu web"
                isOpen={openBlock === 2} onToggle={() => setOpenBlock(openBlock === 2 ? 0 : 2)}
                isComplete={block2Complete}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  <Field label="Años de experiencia">
                    <FocusInput value={survey.anos_experiencia}
                      onChange={(v) => updateField('anos_experiencia', v)} placeholder="ej. 12" />
                  </Field>
                  <Field label="Zona de cobertura">
                    <FocusInput value={survey.zona_cobertura}
                      onChange={(v) => updateField('zona_cobertura', v)} placeholder="ej. Barcelona y área metropolitana" />
                  </Field>
                </div>

                <Field label="Horario de atención" hint="ej. Lunes a viernes 8:00–20:00, sábados 9:00–14:00">
                  <FocusInput value={survey.horario}
                    onChange={(v) => updateField('horario', v)} placeholder="Tus horarios de atención…" />
                </Field>

                <Field label="Historia del negocio (opcional)" hint="Cuéntanos cómo empezaste. Humaniza tu marca.">
                  <FocusTextarea value={survey.historia}
                    onChange={(v) => updateField('historia', v)}
                    placeholder="Brevemente, ¿cómo y por qué empezaste este negocio?" rows={3} />
                </Field>

                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MIST, fontFamily: 'var(--font-instrument)' }}>
                    Testimonios de clientes
                  </label>
                  <p style={{ fontSize: '11px', color: '#C7C7CC', margin: '4px 0 12px', fontFamily: 'var(--font-instrument)' }}>
                    Opcional. Si no tienes, los crearemos a partir de tu perfil.
                  </p>
                  {([1, 2, 3] as const).map((i) => (
                    <div key={i} style={{ backgroundColor: BG_SUB, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px', marginBottom: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <FocusInput
                          value={survey[`testimonio_${i}_nombre` as keyof Survey] as string}
                          onChange={(v) => updateField(`testimonio_${i}_nombre` as keyof Survey, v)}
                          placeholder="Nombre del cliente"
                        />
                        <FocusInput
                          value={survey[`testimonio_${i}_ciudad` as keyof Survey] as string}
                          onChange={(v) => updateField(`testimonio_${i}_ciudad` as keyof Survey, v)}
                          placeholder="Ciudad"
                        />
                      </div>
                      <FocusTextarea
                        value={survey[`testimonio_${i}_texto` as keyof Survey] as string}
                        onChange={(v) => updateField(`testimonio_${i}_texto` as keyof Survey, v)}
                        placeholder={`"${i === 1 ? 'Excelente servicio, muy profesional y rápido.' : i === 2 ? 'Lo recomiendo a todos mis conocidos.' : 'Resolvió el problema en menos de una hora.'}"`}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleBlock>

              {/* ── BLOCK 3 — IDENTIDAD VISUAL ── */}
              <CollapsibleBlock number={3} title="Identidad visual"
                subtitle="Para que el diseño represente cómo quieres que te vean"
                isOpen={openBlock === 3} onToggle={() => setOpenBlock(openBlock === 3 ? 0 : 3)}
                isComplete={block3Complete}
              >
                {/* Logo */}
                <Field label="¿Tienes logo?" required>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {[{ value: 'si', label: 'Sí, lo tengo' }, { value: 'no', label: 'No tengo' }, { value: 'en_proceso', label: 'En proceso' }].map((opt) => (
                      <PillButton key={opt.value} label={opt.label}
                        selected={survey.tiene_logo === opt.value}
                        onClick={() => updateField('tiene_logo', opt.value)} />
                    ))}
                  </div>
                  {survey.tiene_logo === 'si' && (
                    <label style={{ display: 'block', marginTop: '10px', border: `1px dashed ${BORDER}`, borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                      <Upload size={18} style={{ color: MIST, margin: '0 auto 6px', display: 'block' }} />
                      <p style={{ fontSize: '12px', color: MIST, margin: 0, fontFamily: 'var(--font-instrument)' }}>
                        {uploadingLogo ? 'Subiendo…' : survey.logo_url ? '✓ Logo subido — haz clic para cambiar' : 'Sube tu logo (SVG o PNG con fondo transparente)'}
                      </p>
                      <input type="file" accept=".svg,.png" style={{ display: 'none' }}
                        onChange={handleLogoUpload} />
                    </label>
                  )}
                </Field>

                {/* Photos */}
                <Field label="¿Tienes fotos del negocio?" required>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {[{ value: 'si', label: 'Sí tengo' }, { value: 'no', label: 'No tengo' }, { value: 'pronto', label: 'Las haré pronto' }].map((opt) => (
                      <PillButton key={opt.value} label={opt.label}
                        selected={survey.tiene_fotos === opt.value}
                        onClick={() => updateField('tiene_fotos', opt.value)} />
                    ))}
                  </div>
                  {survey.tiene_fotos === 'si' && (
                    <label style={{ display: 'block', marginTop: '10px', border: `1px dashed ${BORDER}`, borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                      <Upload size={18} style={{ color: MIST, margin: '0 auto 6px', display: 'block' }} />
                      <p style={{ fontSize: '12px', color: MIST, margin: 0, fontFamily: 'var(--font-instrument)' }}>
                        {uploadingPhotos ? 'Subiendo…' : survey.fotos_urls?.length > 0 ? `✓ ${survey.fotos_urls.length} foto(s) subida(s) — añadir más` : 'Sube hasta 10 fotos (JPG o PNG)'}
                      </p>
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={handlePhotosUpload} />
                    </label>
                  )}
                </Field>

                {/* Visual style card selector */}
                <Field label="¿Qué estilo visual te representa?" required>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                    {[
                      { value: 'elegante', label: 'Elegante y minimalista', colors: ['#1A1A1A', '#2A2A2A', '#F4F2EC', '#C4A070'] },
                      { value: 'calido',   label: 'Cálido y cercano',      colors: ['#3A1A0A', '#8A3A18', '#F8F0E4', '#D4A020'] },
                      { value: 'moderno',  label: 'Moderno y tecnológico', colors: ['#1A2A4A', '#2A4A7A', '#F4F8FC', '#3A90D0'] },
                      { value: 'artesanal',label: 'Clásico y artesanal',   colors: ['#2A1A0A', '#5A3A18', '#F5F0E5', '#4A6A30'] },
                      { value: 'atrevido', label: 'Atrevido y llamativo',  colors: ['#1A1A2A', '#2A2A4A', '#FAFAFA', '#E040A0'] },
                      { value: 'escogenos',label: 'Escoge por nosotros',   colors: ['#0F1923', '#1E2B3A', '#F5F2EE', '#E8A020'], special: true },
                    ].map((style) => {
                      const sel = survey.estilo_visual === style.value
                      return (
                        <button key={style.value} type="button"
                          onClick={() => updateField('estilo_visual', style.value)}
                          style={{
                            borderRadius: '10px', padding: 0, cursor: 'pointer', overflow: 'hidden',
                            border: `2px solid ${sel ? AMBER : BORDER}`,
                            backgroundColor: sel ? 'rgba(232,160,32,0.04)' : BG_CARD,
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
                    <div style={{ marginTop: '10px', padding: '12px 16px', backgroundColor: 'rgba(232,160,32,0.06)', border: `1px solid rgba(232,160,32,0.2)`, borderRadius: '8px', fontSize: '12px', color: AMBER, fontFamily: 'var(--font-instrument)' }}>
                      ✦ Perfecto. Elegiremos el estilo que mejor encaje con tu sector, tu ciudad y tu personalidad de marca.
                    </div>
                  )}
                </Field>

                <Field label="Webs de referencia (opcional)" hint="URLs de webs que te gusten. No tienen que ser del mismo sector.">
                  <FocusTextarea value={survey.referencias_urls}
                    onChange={(v) => updateField('referencias_urls', v)}
                    placeholder={'https://ejemplo1.com\nhttps://ejemplo2.com'} rows={3} />
                </Field>

                <Field label="¿Tienes colores de marca?" hint="Si ya usas colores concretos en tu negocio, indícalos.">
                  <FocusInput value={survey.colores_marca}
                    onChange={(v) => updateField('colores_marca', v)}
                    placeholder="ej. Azul oscuro y blanco, o #1A3A5A" />
                </Field>
              </CollapsibleBlock>

              {/* ── BLOCK 4 — LA WEB ── */}
              <CollapsibleBlock number={4} title="La web"
                subtitle="Qué páginas y funcionalidades necesitas"
                isOpen={openBlock === 4} onToggle={() => setOpenBlock(openBlock === 4 ? 0 : 4)}
                isComplete={block4Complete}
              >
                <Field label="¿Qué páginas quieres?" required>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                    {[
                      { value: 'inicio',    label: 'Inicio',               locked: true },
                      { value: 'servicios', label: 'Servicios' },
                      { value: 'sobre_mi',  label: 'Sobre mí / nosotros' },
                      { value: 'galeria',   label: 'Galería de fotos' },
                      { value: 'blog',      label: 'Blog' },
                      { value: 'precios',   label: 'Precios' },
                      { value: 'contacto',  label: 'Contacto' },
                      { value: 'reservas',  label: 'Reservas online' },
                      { value: 'tienda',    label: 'Tienda' },
                      { value: 'otro',      label: 'Otra página' },
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
                            backgroundColor: isSelected ? 'rgba(232,160,32,0.06)' : 'transparent',
                            color: page.locked ? AMBER : isSelected ? AMBER : MIST,
                            fontSize: '13px', cursor: page.locked ? 'default' : 'pointer',
                            fontFamily: 'var(--font-instrument)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}
                        >
                          {isSelected && <Check size={12} />}
                          {page.label}
                          {page.locked && <span style={{ fontSize: '10px', color: '#C7C7CC', marginLeft: 'auto' }}>siempre incluida</span>}
                        </button>
                      )
                    })}
                  </div>
                </Field>

                <Field label="¿Cómo quieres que te contacten?" required>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {[
                      { value: 'formulario', label: 'Formulario de contacto' },
                      { value: 'whatsapp',   label: 'Botón de WhatsApp' },
                      { value: 'ambos',      label: 'Ambos' },
                      { value: 'no',         label: 'No por ahora' },
                    ].map((opt) => (
                      <PillButton key={opt.value} label={opt.label}
                        selected={survey.contacto_tipo === opt.value}
                        onClick={() => updateField('contacto_tipo', opt.value)} />
                    ))}
                  </div>
                </Field>

                <Field label="¿Tienes dominio propio?" required>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {[{ value: 'si', label: 'Sí tengo' }, { value: 'no', label: 'Necesito uno' }].map((opt) => (
                      <PillButton key={opt.value} label={opt.label}
                        selected={survey.tiene_dominio === opt.value}
                        onClick={() => updateField('tiene_dominio', opt.value)} />
                    ))}
                  </div>
                  {survey.tiene_dominio === 'si' && (
                    <div style={{ marginTop: '8px' }}>
                      <FocusInput value={survey.dominio_actual}
                        onChange={(v) => updateField('dominio_actual', v)} placeholder="ej. minegocio.es" />
                    </div>
                  )}
                </Field>

                <Field label="¿Hay algo especial que quieras incluir?" hint="ej. Calculadora de presupuesto, zona de reservas, chat en vivo…">
                  <FocusTextarea value={survey.extras}
                    onChange={(v) => updateField('extras', v)}
                    placeholder="Cuéntanos cualquier funcionalidad especial que necesites…" rows={2} />
                </Field>
              </CollapsibleBlock>

              {/* ── BLOCK 5 — CONTACTO Y REDES ── */}
              <CollapsibleBlock number={5} title="Contacto y redes"
                subtitle="Para el footer y la sección de contacto de tu web"
                isOpen={openBlock === 5} onToggle={() => setOpenBlock(openBlock === 5 ? 0 : 5)}
                isComplete={block5Complete}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  <Field label="Teléfono" required>
                    <FocusInput type="tel" value={survey.telefono}
                      onChange={(v) => updateField('telefono', v)} placeholder="ej. 612 345 678" />
                  </Field>
                  <Field label="Email de contacto" required>
                    <FocusInput type="email" value={survey.email_contacto}
                      onChange={(v) => updateField('email_contacto', v)} placeholder="ej. hola@minegocio.es" />
                  </Field>
                  <Field label="WhatsApp">
                    <FocusInput type="tel" value={survey.whatsapp}
                      onChange={(v) => updateField('whatsapp', v)} placeholder="ej. +34 612 345 678" />
                  </Field>
                  <Field label="Dirección física (si aplica)">
                    <FocusInput value={survey.direccion}
                      onChange={(v) => updateField('direccion', v)} placeholder="ej. Calle Mayor 12, Barcelona" />
                  </Field>
                  <Field label="Instagram">
                    <FocusInput value={survey.instagram}
                      onChange={(v) => updateField('instagram', v)} placeholder="@tunegocio" />
                  </Field>
                  <Field label="Facebook (opcional)">
                    <FocusInput value={survey.facebook}
                      onChange={(v) => updateField('facebook', v)} placeholder="facebook.com/tunegocio" />
                  </Field>
                </div>
                <Field label="Google Business (si tienes ficha)" hint="La URL de tu perfil de Google Maps.">
                  <FocusInput value={survey.google_business}
                    onChange={(v) => updateField('google_business', v)} placeholder="https://maps.google.com/…" />
                </Field>
              </CollapsibleBlock>

              {/* ── Submit ── */}
              {progress >= 70 && (
                <div style={{ marginTop: '28px', marginBottom: '48px' }}>
                  {progress < 100 && (
                    <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '12px', color: MIST, marginBottom: '12px', textAlign: 'center' }}>
                      Puedes enviar ahora o completar más campos primero.
                    </p>
                  )}
                  <button
                    type="button" onClick={handleSubmit} disabled={submitting}
                    style={{
                      width: '100%', height: '52px', backgroundColor: INK, color: '#FFFFFF',
                      border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                      cursor: submitting ? 'default' : 'pointer', letterSpacing: '0.02em',
                      fontFamily: 'var(--font-instrument)', opacity: submitting ? 0.7 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {submitting ? 'Enviando…' : '✓ Enviar briefing a Yele Studio'}
                  </button>
                  <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '11px', color: '#C7C7CC', textAlign: 'center', marginTop: '10px' }}>
                    Te contactaremos en menos de 24 horas.
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
