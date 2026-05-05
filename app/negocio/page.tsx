'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

interface FormData {
  business_name: string
  phone: string
  email: string
  address: string
  city: string
  description: string
  website_url: string
  whatsapp_number: string
  preferred_contact: string
  opening_hours: Record<string, string>
}

type ToastType = 'success' | 'error'
interface Toast { id: number; message: string; type: ToastType }

const inputStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.08)',
  color: '#1D1D1F',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  fontFamily: 'var(--font-instrument)',
  transition: 'all 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: '#1D1D1F',
  marginBottom: '6px',
  fontFamily: 'var(--font-instrument)',
}

const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'
}
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
  e.currentTarget.style.boxShadow = 'none'
}

export default function NegocioPage() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    business_name: '', phone: '', email: '', address: '', city: '',
    description: '', website_url: '', whatsapp_number: '',
    preferred_contact: '', opening_hours: {},
  })
  const [dirty, setDirty]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Date.now()
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client, error } = await supabase
        .from('clients').select('*').eq('user_id', user.id).single()

      if (error) console.error('negocio fetch error:', error)
      if (client) {
        setClientId(client.id)
        setForm({
          business_name:     client.business_name    ?? '',
          phone:             client.phone            ?? '',
          email:             client.email            ?? '',
          address:           client.address          ?? '',
          city:              client.city             ?? '',
          description:       client.description      ?? '',
          website_url:       client.website_url      ?? '',
          whatsapp_number:   client.whatsapp_number  ?? '',
          preferred_contact: client.preferred_contact ?? '',
          opening_hours:     client.opening_hours    ?? {},
        })
      }
      setLoading(false)
    }
    loadClient()
  }, [])

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  const handleHoursChange = (dayKey: string, value: string) => {
    setForm((prev) => ({ ...prev, opening_hours: { ...prev.opening_hours, [dayKey]: value } }))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!clientId) return
    setSaving(true)
    const { error } = await supabase.from('clients').update({
      business_name: form.business_name, phone: form.phone, email: form.email,
      address: form.address, description: form.description, website_url: form.website_url,
      whatsapp_number: form.whatsapp_number, preferred_contact: form.preferred_contact,
      opening_hours: form.opening_hours,
    }).eq('id', clientId)

    setSaving(false)
    if (error) {
      console.error('negocio save error:', error)
      addToast('Error al guardar los cambios', 'error')
    } else {
      setDirty(false)
      addToast('✓ Cambios guardados. Los cambios aparecerán en tu web en menos de 60 segundos.', 'success', 8000)
    }
  }

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#F5F5F7',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: '16px',
    padding: '24px',
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main">
        <TopBar title="Mi negocio" />

        <div className="flex-1 p-6 max-w-2xl space-y-8">
          <div>
            <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
              Mi negocio
            </h2>
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
              Esta información aparece en tu web
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-2xl" style={{ backgroundColor: '#F5F5F7' }} />
              ))}
            </div>
          ) : (
            <>
              {dirty && (
                <div
                  className="text-xs px-4 py-2.5 rounded-xl"
                  style={{
                    backgroundColor: 'rgba(200,169,126,0.1)',
                    color: '#92400e',
                    border: '1px solid rgba(200,169,126,0.25)',
                    fontFamily: 'var(--font-instrument)',
                  }}
                >
                  Tienes cambios sin guardar
                </div>
              )}

              {/* Información de contacto */}
              <section style={sectionStyle} className="space-y-4">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
                  Información de contacto
                </h3>

                <div>
                  <label style={labelStyle}>Nombre del negocio</label>
                  <input type="text" value={form.business_name} onChange={(e) => handleChange('business_name', e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Teléfono</label>
                    <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email de contacto</label>
                    <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Dirección</label>
                  <input type="text" value={form.address} onChange={(e) => handleChange('address', e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div>
                  <label style={labelStyle}>Ciudad</label>
                  <input
                    type="text" value={form.city} readOnly
                    style={{ ...inputStyle, color: '#86868B', cursor: 'not-allowed', backgroundColor: '#F5F5F7' }}
                  />
                  <p className="text-xs mt-1.5" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                    Para cambiar la ciudad, contacta con nosotros
                  </p>
                </div>
              </section>

              {/* Descripción */}
              <section style={sectionStyle} className="space-y-4">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
                  Descripción
                </h3>
                <div>
                  <label style={labelStyle}>Descripción breve</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    maxLength={300} rows={4}
                    placeholder="Describe tu negocio en pocas palabras…"
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                      Aparece en tu página de inicio
                    </p>
                    <span
                      className="text-xs"
                      style={{ fontFamily: 'var(--font-instrument)', color: form.description.length > 270 ? '#92400e' : '#86868B' }}
                    >
                      {form.description.length}/300
                    </span>
                  </div>
                </div>
              </section>

              {/* Horario */}
              <section style={sectionStyle} className="space-y-4">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
                  Horario
                </h3>
                <div className="space-y-3">
                  {DAYS.map((day, i) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="text-sm w-24 flex-shrink-0" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                        {day}
                      </span>
                      <input
                        type="text"
                        value={form.opening_hours[DAY_KEYS[i]] ?? ''}
                        onChange={(e) => handleHoursChange(DAY_KEYS[i], e.target.value)}
                        placeholder='09:00 – 20:00 o "Cerrado"'
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Web y redes */}
              <section style={sectionStyle} className="space-y-4">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
                  Web y redes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Web actual</label>
                    <input type="url" value={form.website_url} onChange={(e) => handleChange('website_url', e.target.value)} placeholder="https://…" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={labelStyle}>WhatsApp</label>
                    <input type="tel" value={form.whatsapp_number} onChange={(e) => handleChange('whatsapp_number', e.target.value)} placeholder="+34 600 000 000" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Contacto preferido</label>
                  <select
                    value={form.preferred_contact}
                    onChange={(e) => handleChange('preferred_contact', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={onFocus} onBlur={onBlur}
                  >
                    <option value="">Sin preferencia</option>
                    <option value="phone">Teléfono</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </section>

              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF', fontFamily: 'var(--font-instrument)', fontWeight: 500 }}
                onMouseEnter={(e) => { if (!saving && dirty) e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>

        {/* Toasts */}
        <div className="fixed bottom-5 right-5 space-y-2 z-50 max-w-sm">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: toast.type === 'success' ? 'rgba(6,95,70,0.08)' : 'rgba(153,27,27,0.08)',
                border: `1px solid ${toast.type === 'success' ? 'rgba(6,95,70,0.2)' : 'rgba(153,27,27,0.2)'}`,
                color: toast.type === 'success' ? '#065f46' : '#991b1b',
                fontFamily: 'var(--font-instrument)',
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
