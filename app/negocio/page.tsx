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

export default function NegocioPage() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    business_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    description: '',
    website_url: '',
    whatsapp_number: '',
    preferred_contact: '',
    opening_hours: {},
  })
  const [dirty, setDirty]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now()
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

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
    const { error } = await supabase
      .from('clients')
      .update({
        business_name:     form.business_name,
        phone:             form.phone,
        email:             form.email,
        address:           form.address,
        description:       form.description,
        website_url:       form.website_url,
        whatsapp_number:   form.whatsapp_number,
        preferred_contact: form.preferred_contact,
        opening_hours:     form.opening_hours,
      })
      .eq('id', clientId)

    setSaving(false)
    if (error) {
      console.error('negocio save error:', error)
      addToast('Error al guardar los cambios', 'error')
    } else {
      setDirty(false)
      addToast('Cambios guardados', 'success')
    }
  }

  const inputStyle = {
    backgroundColor: '#0F1923',
    border: '1px solid rgba(45,63,82,0.6)',
    color: '#F5F2EE',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: '#8A9BAD',
    marginBottom: '6px',
  }

  const onFocus  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)' }
  const onBlur   = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'rgba(45,63,82,0.6)' }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0F1923' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col" style={{ marginLeft: '220px' }}>
        <TopBar title="Mi negocio" />

        <div className="flex-1 p-6 max-w-2xl space-y-8">
          <div>
            <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}>
              Mi negocio
            </h2>
            <p className="text-sm" style={{ color: '#8A9BAD' }}>Esta información aparece en tu web</p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg" style={{ backgroundColor: '#1E2B3A' }} />
              ))}
            </div>
          ) : (
            <>
              {dirty && (
                <div
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(232,160,32,0.1)', color: '#E8A020', border: '1px solid rgba(232,160,32,0.2)' }}
                >
                  Tienes cambios sin guardar
                </div>
              )}

              {/* Información de contacto */}
              <section className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#F5F2EE' }}>Información de contacto</h3>

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
                    type="text"
                    value={form.city}
                    readOnly
                    style={{ ...inputStyle, color: '#8A9BAD', cursor: 'not-allowed', backgroundColor: 'rgba(15,25,35,0.5)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#8A9BAD' }}>Para cambiar la ciudad, contacta con nosotros</p>
                </div>
              </section>

              {/* Descripción */}
              <section className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#F5F2EE' }}>Descripción</h3>
                <div>
                  <label style={labelStyle}>Descripción breve</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    maxLength={300}
                    rows={4}
                    placeholder="Describe tu negocio en pocas palabras…"
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs" style={{ color: '#8A9BAD' }}>Aparece en tu página de inicio</p>
                    <span className="text-xs" style={{ color: form.description.length > 270 ? '#E8A020' : '#8A9BAD' }}>
                      {form.description.length}/300
                    </span>
                  </div>
                </div>
              </section>

              {/* Horario */}
              <section className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#F5F2EE' }}>Horario</h3>
                <div className="space-y-3">
                  {DAYS.map((day, i) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="text-sm w-24 flex-shrink-0" style={{ color: '#8A9BAD' }}>{day}</span>
                      <input
                        type="text"
                        value={form.opening_hours[DAY_KEYS[i]] ?? ''}
                        onChange={(e) => handleHoursChange(DAY_KEYS[i], e.target.value)}
                        placeholder='09:00 – 20:00 o "Cerrado"'
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Web y redes */}
              <section className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#F5F2EE' }}>Web y redes</h3>
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
                    onFocus={onFocus}
                    onBlur={onBlur}
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
                className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#E8A020', color: '#0F1923' }}
                onMouseEnter={(e) => { if (!saving && dirty) e.currentTarget.style.backgroundColor = '#B87A10' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E8A020' }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>

        {/* Toasts */}
        <div className="fixed bottom-5 right-5 space-y-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
              style={{
                backgroundColor: toast.type === 'success' ? 'rgba(42,138,90,0.15)' : 'rgba(196,58,42,0.15)',
                border: `1px solid ${toast.type === 'success' ? 'rgba(42,138,90,0.4)' : 'rgba(196,58,42,0.4)'}`,
                color: toast.type === 'success' ? '#2A8A5A' : '#C43A2A',
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
