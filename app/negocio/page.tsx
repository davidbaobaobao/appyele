'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
      addToast('Couldn’t save changes', 'error')
    } else {
      setDirty(false)
      addToast('Changes saved. They appear on your site in under 60 seconds.', 'success', 8000)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F7F6F3' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main">
        <TopBar title="My business" />

        <div className="flex-1 p-6 max-w-2xl space-y-8">
          <div>
            <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
              My business
            </h2>
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
              This information appears on your site
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-2xl" style={{ backgroundColor: '#EEEDE9' }} />
              ))}
            </div>
          ) : (
            <>
              {dirty && (
                <div
                  className="yele-pill"
                  style={{ backgroundColor: 'rgba(138,90,22,0.10)', color: '#8A5A16' }}
                >
                  You have unsaved changes
                </div>
              )}

              {/* Contact details */}
              <section className="yele-card-quiet p-6 space-y-4">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
                  Contact details
                </h3>

                <div>
                  <label className="yele-label">Business name</label>
                  <input type="text" className="yele-input" value={form.business_name} onChange={(e) => handleChange('business_name', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="yele-label">Phone</label>
                    <input type="tel" className="yele-input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="yele-label">Contact email</label>
                    <input type="email" className="yele-input" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="yele-label">Address</label>
                  <input type="text" className="yele-input" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                </div>

                <div>
                  <label className="yele-label">City</label>
                  <input
                    type="text" className="yele-input" value={form.city} readOnly
                    style={{ color: '#8A8A92', cursor: 'not-allowed', backgroundColor: '#F2F0EB' }}
                  />
                  <p className="text-xs mt-1.5" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                    To change the city, get in touch with us
                  </p>
                </div>
              </section>

              {/* Description */}
              <section className="yele-card-quiet p-6 space-y-4">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
                  Description
                </h3>
                <div>
                  <label className="yele-label">Short description</label>
                  <textarea
                    className="yele-textarea"
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    maxLength={300} rows={4}
                    placeholder="Describe your business in a few words…"
                    style={{ resize: 'vertical' }}
                  />
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                      Appears on your home page
                    </p>
                    <span
                      className="text-xs"
                      style={{ fontFamily: 'var(--font-mono)', color: form.description.length > 270 ? '#8A5A16' : '#8A8A92' }}
                    >
                      {form.description.length}/300
                    </span>
                  </div>
                </div>
              </section>

              {/* Opening hours */}
              <section className="yele-card-quiet p-6 space-y-4">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
                  Opening hours
                </h3>
                <div className="space-y-3">
                  {DAYS.map((day, i) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="text-sm w-24 flex-shrink-0" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                        {day}
                      </span>
                      <input
                        type="text"
                        className="yele-input"
                        value={form.opening_hours[DAY_KEYS[i]] ?? ''}
                        onChange={(e) => handleHoursChange(DAY_KEYS[i], e.target.value)}
                        placeholder='09:00 – 20:00 or "Closed"'
                        style={{ flex: 1 }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Web and social */}
              <section className="yele-card-quiet p-6 space-y-4">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
                  Web and social
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="yele-label">Current website</label>
                    <input type="url" className="yele-input" value={form.website_url} onChange={(e) => handleChange('website_url', e.target.value)} placeholder="https://…" />
                  </div>
                  <div>
                    <label className="yele-label">WhatsApp</label>
                    <input type="tel" className="yele-input" value={form.whatsapp_number} onChange={(e) => handleChange('whatsapp_number', e.target.value)} placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div>
                  <label className="yele-label">Preferred contact</label>
                  <select
                    className="yele-select"
                    value={form.preferred_contact}
                    onChange={(e) => handleChange('preferred_contact', e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">No preference</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </section>

              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="yele-btn yele-btn-primary w-full sm:w-auto"
              >
                {saving ? 'Saving…' : 'Save changes'}
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
                backgroundColor: toast.type === 'success' ? 'rgba(31,122,85,0.10)' : 'rgba(179,56,43,0.09)',
                border: `1px solid ${toast.type === 'success' ? 'rgba(31,122,85,0.20)' : 'rgba(179,56,43,0.20)'}`,
                color: toast.type === 'success' ? '#1F7A55' : '#B3382B',
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
