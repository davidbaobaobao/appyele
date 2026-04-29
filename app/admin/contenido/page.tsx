'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, Eye, EyeOff, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/components/ImageUploader'
import SortableList from '@/components/SortableList'
import { revalidateYeleSite } from '@/lib/revalidate'

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

  async function load() {
    try {
      const { data } = await supabase.from('showcase_projects').select('*').order('sort_order', { ascending: true })
      setItems(data ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function update(idx: number, patch: Partial<ShowcaseProject>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function save(idx: number) {
    const item = items[idx]
    setSaving(String(idx))
    try {
      let sortOrder = item.sort_order
      if (!item.id) {
        const { data: maxData } = await supabase
          .from('showcase_projects').select('sort_order').order('sort_order', { ascending: false }).limit(1)
        sortOrder = (maxData?.[0]?.sort_order ?? 0) + 1
      }
      const payload = {
        name: item.name,
        description: item.description || '',
        main_image: item.main_image,
        additional_images: Array.isArray(item.additional_images) ? item.additional_images.filter(Boolean) : [],
        visible: item.visible,
        sort_order: sortOrder,
      }
      let saved: ShowcaseProject
      if (item.id) {
        const { data, error } = await supabase.from('showcase_projects').update(payload).eq('id', item.id).select().single()
        if (error) throw error
        saved = data
      } else {
        const { data, error } = await supabase.from('showcase_projects').insert(payload).select().single()
        if (error) throw error
        saved = data
      }
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...saved } : it))
      await Promise.all([revalidateYeleSite('/'), revalidateYeleSite('/ejemplos')])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error guardando showcase:', err)
      alert('Error guardando: ' + msg)
    } finally { setSaving(null) }
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return
    try {
      const { error } = await supabase.from('showcase_projects').delete().eq('id', item.id)
      if (error) throw error
      setItems(prev => prev.filter((_, i) => i !== idx))
      await Promise.all([revalidateYeleSite('/'), revalidateYeleSite('/ejemplos')])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error eliminando showcase:', err)
      alert('Error al eliminar: ' + msg)
    }
  }

  async function handleReorder(reordered: { id: string }[]) {
    const unsaved = items.filter(it => !it.id)
    setItems([...(reordered as ShowcaseProject[]), ...unsaved])
    try {
      await Promise.all(
        reordered.map((it, index) =>
          supabase.from('showcase_projects').update({ sort_order: index + 1 }).eq('id', it.id)
        )
      )
      await Promise.all([revalidateYeleSite('/'), revalidateYeleSite('/ejemplos')])
    } catch (err) { console.error('Error reordenando showcase:', err) }
  }

  function renderShowcaseCard(item: ShowcaseProject, idx: number) {
    return (
      <div style={S.card}>
        <div className="grid grid-cols-1 gap-3">
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
          <ImageUploader label="Imagen principal" value={item.main_image} onChange={url => update(idx, { main_image: url })} />
          <div>
            <label style={S.label}>Imágenes adicionales</label>
            <div className="space-y-2">
              {item.additional_images.map((imgUrl, imgIdx) => (
                <div key={imgIdx} className="flex items-start gap-2">
                  <div className="flex-1">
                    <ImageUploader
                      value={imgUrl}
                      onChange={url => {
                        const next = [...item.additional_images]
                        next[imgIdx] = url
                        update(idx, { additional_images: next })
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => update(idx, { additional_images: item.additional_images.filter((_, i) => i !== imgIdx) })}
                    style={{ ...S.btnDanger, padding: '6px', marginTop: '18px', flexShrink: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 10px' }}
                onClick={() => update(idx, { additional_images: [...item.additional_images, ''] })}
              >
                <Plus size={12} /> Añadir imagen
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
    )
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A9BAD' }}>Cargando…</div>

  const savedItems = items.filter(it => it.id)
  const unsavedItems = items.filter(it => !it.id)

  return (
    <div className="space-y-2">
      <SortableList
        items={savedItems.map(it => ({ ...it, id: it.id! }))}
        onReorder={handleReorder}
        renderItem={(item) => {
          const idx = items.findIndex(it => it.id === (item as ShowcaseProject).id)
          return renderShowcaseCard(items[idx], idx)
        }}
      />
      {unsavedItems.map((item) => {
        const idx = items.indexOf(item)
        return <div key={idx}>{renderShowcaseCard(item, idx)}</div>
      })}
      <button
        style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}
        onClick={() => setItems(prev => [...prev, { name: '', description: '', main_image: '', additional_images: [], visible: true, sort_order: 0 }])}
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

  async function load() {
    try {
      const { data } = await supabase.from('testimonials').select('*').order('sort_order', { ascending: true })
      setItems(data ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function update(idx: number, patch: Partial<Testimonial>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function save(idx: number) {
    const item = items[idx]
    setSaving(String(idx))
    try {
      let sortOrder = item.sort_order
      if (!item.id) {
        const { data: maxData } = await supabase
          .from('testimonials').select('sort_order').order('sort_order', { ascending: false }).limit(1)
        sortOrder = (maxData?.[0]?.sort_order ?? 0) + 1
      }
      const payload = { author: item.author, role: item.role || '', text: item.text, visible: item.visible, sort_order: sortOrder }
      let saved: Testimonial
      if (item.id) {
        const { data, error } = await supabase.from('testimonials').update(payload).eq('id', item.id).select().single()
        if (error) throw error
        saved = data
      } else {
        const { data, error } = await supabase.from('testimonials').insert(payload).select().single()
        if (error) throw error
        saved = data
      }
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...saved } : it))
      await revalidateYeleSite('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error guardando testimonio:', err)
      alert('Error guardando: ' + msg)
    } finally { setSaving(null) }
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('¿Eliminar este testimonio? Esta acción no se puede deshacer.')) return
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', item.id)
      if (error) throw error
      setItems(prev => prev.filter((_, i) => i !== idx))
      await revalidateYeleSite('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error eliminando testimonio:', err)
      alert('Error al eliminar: ' + msg)
    }
  }

  async function handleReorder(reordered: { id: string }[]) {
    const unsaved = items.filter(it => !it.id)
    setItems([...(reordered as Testimonial[]), ...unsaved])
    try {
      await Promise.all(
        reordered.map((it, index) =>
          supabase.from('testimonials').update({ sort_order: index + 1 }).eq('id', it.id)
        )
      )
      await revalidateYeleSite('/')
    } catch (err) { console.error('Error reordenando testimonials:', err) }
  }

  function renderTestimonialCard(item: Testimonial, idx: number) {
    return (
      <div style={S.card}>
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
    )
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A9BAD' }}>Cargando…</div>

  const savedItems = items.filter(it => it.id)
  const unsavedItems = items.filter(it => !it.id)

  return (
    <div className="space-y-2">
      <SortableList
        items={savedItems.map(it => ({ ...it, id: it.id! }))}
        onReorder={handleReorder}
        renderItem={(item) => {
          const idx = items.findIndex(it => it.id === (item as Testimonial).id)
          return renderTestimonialCard(items[idx], idx)
        }}
      />
      {unsavedItems.map((item) => {
        const idx = items.indexOf(item)
        return <div key={idx}>{renderTestimonialCard(item, idx)}</div>
      })}
      <button
        style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}
        onClick={() => setItems(prev => [...prev, { author: '', role: '', text: '', visible: true, sort_order: 0 }])}
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

  async function load() {
    try {
      const { data } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true })
      setItems(data ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function update(idx: number, patch: Partial<FAQItem>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function save(idx: number) {
    const item = items[idx]
    setSaving(String(idx))
    try {
      let sortOrder = item.sort_order
      if (!item.id) {
        const { data: maxData } = await supabase
          .from('faqs').select('sort_order').order('sort_order', { ascending: false }).limit(1)
        sortOrder = (maxData?.[0]?.sort_order ?? 0) + 1
      }
      const payload = { question: item.question, answer: item.answer, visible: item.visible, sort_order: sortOrder }
      let saved: FAQItem
      if (item.id) {
        const { data, error } = await supabase.from('faqs').update(payload).eq('id', item.id).select().single()
        if (error) throw error
        saved = data
      } else {
        const { data, error } = await supabase.from('faqs').insert(payload).select().single()
        if (error) throw error
        saved = data
      }
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...saved } : it))
      await revalidateYeleSite('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error guardando FAQ:', err)
      alert('Error guardando: ' + msg)
    } finally { setSaving(null) }
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', item.id)
      if (error) throw error
      setItems(prev => prev.filter((_, i) => i !== idx))
      await revalidateYeleSite('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error eliminando FAQ:', err)
      alert('Error al eliminar: ' + msg)
    }
  }

  async function handleReorder(reordered: { id: string }[]) {
    const unsaved = items.filter(it => !it.id)
    setItems([...(reordered as FAQItem[]), ...unsaved])
    try {
      await Promise.all(
        reordered.map((it, index) =>
          supabase.from('faqs').update({ sort_order: index + 1 }).eq('id', it.id)
        )
      )
      await revalidateYeleSite('/')
    } catch (err) { console.error('Error reordenando faqs:', err) }
  }

  function renderFAQCard(item: FAQItem, idx: number) {
    return (
      <div style={S.card}>
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
    )
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A9BAD' }}>Cargando…</div>

  const savedItems = items.filter(it => it.id)
  const unsavedItems = items.filter(it => !it.id)

  return (
    <div className="space-y-2">
      <SortableList
        items={savedItems.map(it => ({ ...it, id: it.id! }))}
        onReorder={handleReorder}
        renderItem={(item) => {
          const idx = items.findIndex(it => it.id === (item as FAQItem).id)
          return renderFAQCard(items[idx], idx)
        }}
      />
      {unsavedItems.map((item) => {
        const idx = items.indexOf(item)
        return <div key={idx}>{renderFAQCard(item, idx)}</div>
      })}
      <button
        style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}
        onClick={() => setItems(prev => [...prev, { question: '', answer: '', visible: true, sort_order: 0 }])}
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

      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: '#1E2B3A', width: 'fit-content' }}>
        {(['ejemplos', 'testimonios', 'faqs'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'ejemplos'    && <ShowcaseSection />}
      {tab === 'testimonios' && <TestimonialsSection />}
      {tab === 'faqs'        && <FAQsSection />}
    </div>
  )
}
