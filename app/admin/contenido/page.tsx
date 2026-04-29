'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, Eye, EyeOff, GripVertical } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface ShowcaseProject {
  id?: string
  name: string
  description: string
  main_image: string
  additional_images: string[]
  visible: boolean
  sort_order: number
}

interface Testimonial {
  id?: string
  author: string
  role: string
  text: string
  visible: boolean
  sort_order: number
}

interface FAQItem {
  id?: string
  question: string
  answer: string
  visible: boolean
  sort_order: number
}

// ── Style constants ───────────────────────────────────────────────────────────

const S = {
  card: { backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)', borderRadius: '12px', padding: '16px' },
  input: { backgroundColor: '#152030', border: '1px solid rgba(45,63,82,0.6)', color: '#F5F2EE', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', outline: 'none', width: '100%' },
  label: { color: '#8A9BAD', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block', marginBottom: '4px' },
  btnPrimary: { backgroundColor: '#E05A2B', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#F5F2EE', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  btnDanger: { backgroundColor: 'rgba(196,58,42,0.15)', color: '#C43A2A', border: '1px solid rgba(196,58,42,0.3)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' },
  tab: (active: boolean) => ({
    padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    borderRadius: '8px', border: 'none',
    backgroundColor: active ? '#E05A2B' : 'transparent',
    color: active ? '#fff' : '#8A9BAD',
  }),
}

// ── Showcase Section ──────────────────────────────────────────────────────────

function ShowcaseSection() {
  const [items, setItems] = useState<ShowcaseProject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/showcase').then(r => r.json()).then(d => { setItems(d); setLoading(false) })
  }, [])

  function newItem(): ShowcaseProject {
    return { name: '', description: '', main_image: '', additional_images: [], visible: true, sort_order: items.length }
  }

  function update(idx: number, patch: Partial<ShowcaseProject>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function save(idx: number) {
    const item = items[idx]
    setSaving(String(idx))
    const res = await fetch('/api/admin/showcase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    const saved = await res.json()
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...saved } : it))
    setSaving(null)
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('¿Eliminar este proyecto?')) return
    await fetch(`/api/admin/showcase/${item.id}`, { method: 'DELETE' })
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A9BAD' }}>Cargando…</div>

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id ?? idx} style={S.card}>
          <div className="flex items-start gap-3">
            <GripVertical size={16} style={{ color: '#8A9BAD', marginTop: '2px', flexShrink: 0 }} />
            <div className="flex-1 grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={S.label}>Nombre</label>
                  <input style={S.input} value={item.name} onChange={e => update(idx, { name: e.target.value })} placeholder="El Taller · Cerámica, Gràcia" />
                </div>
                <div>
                  <label style={S.label}>Descripción</label>
                  <input style={S.input} value={item.description} onChange={e => update(idx, { description: e.target.value })} placeholder="Breve descripción" />
                </div>
              </div>
              <div>
                <label style={S.label}>Imagen principal (URL)</label>
                <input style={S.input} value={item.main_image} onChange={e => update(idx, { main_image: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label style={S.label}>Imágenes adicionales (URLs separadas por coma)</label>
                <input
                  style={S.input}
                  value={item.additional_images.join(', ')}
                  onChange={e => update(idx, { additional_images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="https://…, https://…"
                />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label style={S.label}>Orden</label>
                  <input type="number" style={{ ...S.input, width: '70px' }} value={item.sort_order} onChange={e => update(idx, { sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-end gap-2 pb-0.5 mt-auto">
                  <button style={S.btnGhost} onClick={() => update(idx, { visible: !item.visible })}>
                    {item.visible ? <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <EyeOff size={13} style={{ display: 'inline', marginRight: '4px' }} />}
                    {item.visible ? 'Visible' : 'Oculto'}
                  </button>
                  <button style={S.btnPrimary} onClick={() => save(idx)} disabled={saving === String(idx)}>
                    <Save size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {saving === String(idx) ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button style={S.btnDanger} onClick={() => remove(idx)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: '6px' }}
        onClick={() => setItems(prev => [...prev, newItem()])}
      >
        <Plus size={14} /> Añadir proyecto
      </button>
    </div>
  )
}

// ── Testimonials Section ──────────────────────────────────────────────────────

function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/testimonials').then(r => r.json()).then(d => { setItems(d); setLoading(false) })
  }, [])

  function newItem(): Testimonial {
    return { author: '', role: '', text: '', visible: true, sort_order: items.length }
  }

  function update(idx: number, patch: Partial<Testimonial>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function save(idx: number) {
    const item = items[idx]
    setSaving(String(idx))
    const res = await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    const saved = await res.json()
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...saved } : it))
    setSaving(null)
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('¿Eliminar este testimonio?')) return
    await fetch(`/api/admin/testimonials/${item.id}`, { method: 'DELETE' })
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A9BAD' }}>Cargando…</div>

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id ?? idx} style={S.card}>
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={S.label}>Autor</label>
                <input style={S.input} value={item.author} onChange={e => update(idx, { author: e.target.value })} placeholder="Sara M." />
              </div>
              <div>
                <label style={S.label}>Cargo / Ciudad</label>
                <input style={S.input} value={item.role} onChange={e => update(idx, { role: e.target.value })} placeholder="Instructora de yoga, Madrid" />
              </div>
            </div>
            <div>
              <label style={S.label}>Texto</label>
              <textarea
                style={{ ...S.input, minHeight: '72px', resize: 'vertical' }}
                value={item.text}
                onChange={e => update(idx, { text: e.target.value })}
                placeholder="Testimonio del cliente…"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="number" style={{ ...S.input, width: '70px' }} value={item.sort_order} onChange={e => update(idx, { sort_order: Number(e.target.value) })} />
              <button style={S.btnGhost} onClick={() => update(idx, { visible: !item.visible })}>
                {item.visible ? <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <EyeOff size={13} style={{ display: 'inline', marginRight: '4px' }} />}
                {item.visible ? 'Visible' : 'Oculto'}
              </button>
              <button style={S.btnPrimary} onClick={() => save(idx)} disabled={saving === String(idx)}>
                <Save size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {saving === String(idx) ? 'Guardando…' : 'Guardar'}
              </button>
              <button style={S.btnDanger} onClick={() => remove(idx)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: '6px' }}
        onClick={() => setItems(prev => [...prev, newItem()])}
      >
        <Plus size={14} /> Añadir testimonio
      </button>
    </div>
  )
}

// ── FAQs Section ──────────────────────────────────────────────────────────────

function FAQsSection() {
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/faqs').then(r => r.json()).then(d => { setItems(d); setLoading(false) })
  }, [])

  function newItem(): FAQItem {
    return { question: '', answer: '', visible: true, sort_order: items.length }
  }

  function update(idx: number, patch: Partial<FAQItem>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function save(idx: number) {
    const item = items[idx]
    setSaving(String(idx))
    const res = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    const saved = await res.json()
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...saved } : it))
    setSaving(null)
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('¿Eliminar esta pregunta?')) return
    await fetch(`/api/admin/faqs/${item.id}`, { method: 'DELETE' })
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A9BAD' }}>Cargando…</div>

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id ?? idx} style={S.card}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label style={S.label}>Pregunta</label>
              <input style={S.input} value={item.question} onChange={e => update(idx, { question: e.target.value })} placeholder="¿Cuánto tarda mi web?" />
            </div>
            <div>
              <label style={S.label}>Respuesta</label>
              <textarea
                style={{ ...S.input, minHeight: '72px', resize: 'vertical' }}
                value={item.answer}
                onChange={e => update(idx, { answer: e.target.value })}
                placeholder="Respuesta completa…"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="number" style={{ ...S.input, width: '70px' }} value={item.sort_order} onChange={e => update(idx, { sort_order: Number(e.target.value) })} />
              <button style={S.btnGhost} onClick={() => update(idx, { visible: !item.visible })}>
                {item.visible ? <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <EyeOff size={13} style={{ display: 'inline', marginRight: '4px' }} />}
                {item.visible ? 'Visible' : 'Oculto'}
              </button>
              <button style={S.btnPrimary} onClick={() => save(idx)} disabled={saving === String(idx)}>
                <Save size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {saving === String(idx) ? 'Guardando…' : 'Guardar'}
              </button>
              <button style={S.btnDanger} onClick={() => remove(idx)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: '6px' }}
        onClick={() => setItems(prev => [...prev, newItem()])}
      >
        <Plus size={14} /> Añadir pregunta
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'ejemplos' | 'testimonios' | 'faqs'

export default function ContenidoPage() {
  const [tab, setTab] = useState<Tab>('ejemplos')

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-2xl" style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}>
          Contenido
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A9BAD' }}>
          Gestiona proyectos, testimonios y FAQ del sitio público
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: '#1E2B3A', width: 'fit-content' }}>
        {(['ejemplos', 'testimonios', 'faqs'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'ejemplos'    && <ShowcaseSection />}
      {tab === 'testimonios' && <TestimonialsSection />}
      {tab === 'faqs'        && <FAQsSection />}
    </div>
  )
}
