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

// Destructive action: keeps the .yele-btn pill, overrides colour only.
const dangerBtn = {
  backgroundColor: 'rgba(179,56,43,0.09)',
  color: '#B3382B',
  border: '1px solid rgba(179,56,43,0.22)',
  padding: '9px 14px',
}

const tabBtn = (active: boolean) => ({
  backgroundColor: active ? '#16161A' : 'transparent',
  color: active ? '#FFFFFF' : '#8A8A92',
  border: '1px solid transparent',
  boxShadow: 'none',
})

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
      console.error('Error saving showcase:', err)
      alert("Couldn't save: " + msg)
    } finally { setSaving(null) }
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/showcase/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert("Couldn't delete: " + (body.error ?? res.statusText) + (body.code ? ' — code: ' + body.code : ''))
        return
      }
      setItems(prev => prev.filter((_, i) => i !== idx))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error deleting showcase:', err)
      alert("Couldn't delete: " + msg)
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
    } catch (err) { console.error('Error reordering showcase:', err) }
  }

  function renderShowcaseCard(item: ShowcaseProject, idx: number) {
    return (
      <div className="yele-card p-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="yele-label">Name</label>
              <input className="yele-input" value={item.name} onChange={e => update(idx, { name: e.target.value })} placeholder="The Workshop · Ceramics, Brooklyn" />
            </div>
            <div>
              <label className="yele-label">Description</label>
              <input className="yele-input" value={item.description} onChange={e => update(idx, { description: e.target.value })} placeholder="Short description" />
            </div>
          </div>
          <ImageUploader label="Main image" value={item.main_image} onChange={url => update(idx, { main_image: url })} />
          <div>
            <label className="yele-label">Additional images</label>
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
                    className="yele-btn"
                    style={{ ...dangerBtn, padding: '9px', marginTop: '18px', flexShrink: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="yele-btn yele-btn-ghost"
                style={{ fontSize: '12px', padding: '7px 14px' }}
                onClick={() => update(idx, { additional_images: [...item.additional_images, ''] })}
              >
                <Plus size={12} /> Add image
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="yele-btn yele-btn-secondary" onClick={() => update(idx, { visible: !item.visible })}>
              {item.visible ? <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <EyeOff size={13} style={{ display: 'inline', marginRight: '4px' }} />}
              {item.visible ? 'Visible' : 'Hidden'}
            </button>
            <button className="yele-btn yele-btn-primary" onClick={() => save(idx)} disabled={saving === String(idx)}>
              <Save size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {saving === String(idx) ? 'Saving…' : 'Save'}
            </button>
            <button className="yele-btn" style={dangerBtn} onClick={() => remove(idx)}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>Loading…</div>

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
        className="yele-btn yele-btn-secondary mt-2"
        onClick={() => setItems(prev => [...prev, { name: '', description: '', main_image: '', additional_images: [], visible: true, sort_order: 0 }])}
      >
        <Plus size={14} /> Add project
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
      console.error('Error saving testimonial:', err)
      alert("Couldn't save: " + msg)
    } finally { setSaving(null) }
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('Delete this testimonial? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/testimonials/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert("Couldn't delete: " + (body.error ?? res.statusText) + (body.code ? ' — code: ' + body.code : ''))
        return
      }
      setItems(prev => prev.filter((_, i) => i !== idx))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error deleting testimonial:', err)
      alert("Couldn't delete: " + msg)
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
    } catch (err) { console.error('Error reordering testimonials:', err) }
  }

  function renderTestimonialCard(item: Testimonial, idx: number) {
    return (
      <div className="yele-card p-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="yele-label">Author</label>
              <input className="yele-input" value={item.author} onChange={e => update(idx, { author: e.target.value })} placeholder="Sara M." />
            </div>
            <div>
              <label className="yele-label">Role / City</label>
              <input className="yele-input" value={item.role} onChange={e => update(idx, { role: e.target.value })} placeholder="Yoga instructor, Austin" />
            </div>
          </div>
          <div>
            <label className="yele-label">Text</label>
            <textarea
              className="yele-textarea"
              style={{ minHeight: '72px', resize: 'vertical' }}
              value={item.text}
              onChange={e => update(idx, { text: e.target.value })}
              placeholder="Client testimonial…"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="yele-btn yele-btn-secondary" onClick={() => update(idx, { visible: !item.visible })}>
              {item.visible ? <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <EyeOff size={13} style={{ display: 'inline', marginRight: '4px' }} />}
              {item.visible ? 'Visible' : 'Hidden'}
            </button>
            <button className="yele-btn yele-btn-primary" onClick={() => save(idx)} disabled={saving === String(idx)}>
              <Save size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {saving === String(idx) ? 'Saving…' : 'Save'}
            </button>
            <button className="yele-btn" style={dangerBtn} onClick={() => remove(idx)}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>Loading…</div>

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
        className="yele-btn yele-btn-secondary mt-2"
        onClick={() => setItems(prev => [...prev, { author: '', role: '', text: '', visible: true, sort_order: 0 }])}
      >
        <Plus size={14} /> Add testimonial
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
      console.error('Error saving FAQ:', err)
      alert("Couldn't save: " + msg)
    } finally { setSaving(null) }
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('Delete this question? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/faqs/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert("Couldn't delete: " + (body.error ?? res.statusText) + (body.code ? ' — code: ' + body.code : ''))
        return
      }
      setItems(prev => prev.filter((_, i) => i !== idx))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('Error deleting FAQ:', err)
      alert("Couldn't delete: " + msg)
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
    } catch (err) { console.error('Error reordering FAQs:', err) }
  }

  function renderFAQCard(item: FAQItem, idx: number) {
    return (
      <div className="yele-card p-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="yele-label">Question</label>
            <input className="yele-input" value={item.question} onChange={e => update(idx, { question: e.target.value })} placeholder="How long does my site take?" />
          </div>
          <div>
            <label className="yele-label">Answer</label>
            <textarea
              className="yele-textarea"
              style={{ minHeight: '72px', resize: 'vertical' }}
              value={item.answer}
              onChange={e => update(idx, { answer: e.target.value })}
              placeholder="Full answer…"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="yele-btn yele-btn-secondary" onClick={() => update(idx, { visible: !item.visible })}>
              {item.visible ? <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <EyeOff size={13} style={{ display: 'inline', marginRight: '4px' }} />}
              {item.visible ? 'Visible' : 'Hidden'}
            </button>
            <button className="yele-btn yele-btn-primary" onClick={() => save(idx)} disabled={saving === String(idx)}>
              <Save size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {saving === String(idx) ? 'Saving…' : 'Save'}
            </button>
            <button className="yele-btn" style={dangerBtn} onClick={() => remove(idx)}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>Loading…</div>

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
        className="yele-btn yele-btn-secondary mt-2"
        onClick={() => setItems(prev => [...prev, { question: '', answer: '', visible: true, sort_order: 0 }])}
      >
        <Plus size={14} /> Add question
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'ejemplos' | 'testimonios' | 'faqs'

// Tab keys are internal state only — labels are what the user reads.
const TAB_LABELS: Record<Tab, string> = {
  ejemplos: 'Showcase',
  testimonios: 'Testimonials',
  faqs: 'FAQs',
}

export default function ContenidoPage() {
  const [tab, setTab] = useState<Tab>('ejemplos')

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <p className="yele-eyebrow mb-2">Admin panel</p>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
          Content
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>
          Manage projects, testimonials and FAQs on the public site
        </p>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: '#F2F0EB', width: 'fit-content' }}>
        {(['ejemplos', 'testimonios', 'faqs'] as Tab[]).map(t => (
          <button key={t} className="yele-btn" style={tabBtn(tab === t)} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'ejemplos'    && <ShowcaseSection />}
      {tab === 'testimonios' && <TestimonialsSection />}
      {tab === 'faqs'        && <FAQsSection />}
    </div>
  )
}
