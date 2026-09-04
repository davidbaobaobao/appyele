'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UtensilsCrossed, Briefcase, Users, Quote, HelpCircle, Tag, Home, Image, Plus, Trash2, Save, Eye, EyeOff, GripVertical, X } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import CardManager, { FieldDef } from '@/components/CardManager'
import { revalidateYeleSite } from '@/lib/revalidate'

// ── Admin-only Showcase Section ───────────────────────────────────────────────

// Destructive actions keep the pill shape but carry the danger colour inline.
const DANGER_BTN: React.CSSProperties = {
  backgroundColor: 'rgba(179,56,43,0.09)',
  color: '#B3382B',
  border: '1px solid rgba(179,56,43,0.20)',
}

// Listing `type` values are stored in Supabase as-is; only their labels are English.
const LISTING_TYPE_LABELS: Record<string, string> = { Venta: 'For sale', Alquiler: 'For rent' }

interface ShowcaseProject {
  id?: string
  name: string
  description: string
  main_image: string
  additional_images: string[]
  visible: boolean
  sort_order: number
}

function AdminShowcaseSection() {
  const [items, setItems] = useState<ShowcaseProject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('showcase_projects').select('*').order('sort_order', { ascending: true })
        setItems(data ?? [])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  function newItem(): ShowcaseProject {
    return { name: '', description: '', main_image: '', additional_images: [], visible: true, sort_order: 0 }
  }

  function update(idx: number, patch: Partial<ShowcaseProject>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function save(idx: number) {
    const item = items[idx]
    setSaving(String(idx))
    try {
      let sortOrder = item.sort_order
      if (!item.id) {
        const { data: maxData } = await supabase.from('showcase_projects').select('sort_order').order('sort_order', { ascending: false }).limit(1)
        sortOrder = (maxData?.[0]?.sort_order ?? 0) + 1
      }
      const payload = {
        name: item.name, description: item.description || '', main_image: item.main_image,
        additional_images: Array.isArray(item.additional_images) ? item.additional_images.filter(Boolean) : [],
        visible: item.visible, sort_order: sortOrder,
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
      alert("Couldn't save: " + msg)
    } finally { setSaving(null) }
  }

  async function remove(idx: number) {
    const item = items[idx]
    if (!item.id) { setItems(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('Delete this project?')) return
    await fetch(`/api/admin/showcase/${item.id}`, { method: 'DELETE' })
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>Loading…</div>

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id ?? idx} className="yele-card p-4">
          <div className="flex items-start gap-3">
            <GripVertical size={16} style={{ color: '#8A8A92', marginTop: '2px', flexShrink: 0 }} />
            <div className="flex-1 grid grid-cols-1 gap-3">
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
                        <ImageUploader value={imgUrl} onChange={url => {
                          const next = [...item.additional_images]; next[imgIdx] = url
                          update(idx, { additional_images: next })
                        }} />
                      </div>
                      <button type="button" aria-label="Remove image"
                        onClick={() => update(idx, { additional_images: item.additional_images.filter((_, i) => i !== imgIdx) })}
                        className="yele-btn" style={{ ...DANGER_BTN, padding: '8px', marginTop: '18px', flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="yele-btn yele-btn-secondary"
                    onClick={() => update(idx, { additional_images: [...item.additional_images, ''] })}>
                    <Plus size={12} /> Add image
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="yele-btn yele-btn-secondary" onClick={() => update(idx, { visible: !item.visible })}>
                  {item.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  {item.visible ? 'Visible' : 'Hidden'}
                </button>
                <button className="yele-btn yele-btn-primary" onClick={() => save(idx)} disabled={saving === String(idx)}>
                  <Save size={13} />
                  {saving === String(idx) ? 'Saving…' : 'Save'}
                </button>
                <button aria-label="Delete project" className="yele-btn" style={{ ...DANGER_BTN, padding: '10px' }} onClick={() => remove(idx)}><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button className="yele-btn yele-btn-secondary" onClick={() => setItems(prev => [...prev, newItem()])}>
        <Plus size={14} /> Add project
      </button>
    </div>
  )
}

const SECTION_CONFIG: Record<string, { title: string; icon: React.ReactNode; fields: FieldDef[] }> = {
  catalog_items: {
    title: 'Menu / Catalog', icon: <UtensilsCrossed size={14} />,
    fields: [
      { key: 'name',        label: 'Name',        type: 'text',     required: true, placeholder: 'e.g. Grilled salmon' },
      { key: 'category',    label: 'Category',    type: 'text',     placeholder: 'e.g. Mains' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the item…' },
      { key: 'price',       label: 'Price',       type: 'text',     placeholder: 'e.g. $14.50' },
      { key: 'image_url',   label: 'Image',       type: 'image' },
      { key: 'available',   label: 'Available',   type: 'toggle' },
    ],
  },
  services: {
    title: 'Services', icon: <Briefcase size={14} />,
    fields: [
      { key: 'name',        label: 'Service name', type: 'text',     required: true },
      { key: 'description', label: 'Description',  type: 'textarea' },
      { key: 'price',       label: 'Price',        type: 'text',     placeholder: 'e.g. From $50' },
      { key: 'price_label', label: 'Price label',  type: 'text',     placeholder: 'e.g. On request' },
    ],
  },
  team_members: {
    title: 'Team', icon: <Users size={14} />,
    fields: [
      { key: 'name',      label: 'Name',  type: 'text', required: true },
      { key: 'role',      label: 'Role',  type: 'text' },
      { key: 'photo_url', label: 'Photo', type: 'image' },
    ],
  },
  testimonials: {
    title: 'Testimonials', icon: <Quote size={14} />,
    fields: [
      { key: 'author_name', label: 'Author name', type: 'text',     required: true },
      { key: 'role',        label: 'Author role', type: 'text' },
      { key: 'body',        label: 'Testimonial', type: 'textarea', required: true },
      { key: 'rating',      label: 'Rating (1–5)', type: 'number',   placeholder: '5' },
    ],
  },
  faqs: {
    title: 'FAQs', icon: <HelpCircle size={14} />,
    fields: [
      { key: 'question', label: 'Question', type: 'text',     required: true },
      { key: 'answer',   label: 'Answer',   type: 'textarea', required: true },
    ],
  },
  offers: {
    title: 'Offers', icon: <Tag size={14} />,
    fields: [
      { key: 'title',       label: 'Title',       type: 'text',     required: true },
      { key: 'badge',       label: 'Badge',       type: 'text',     placeholder: 'e.g. -20%' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'valid_until', label: 'Valid until', type: 'date' },
    ],
  },
  listings: {
    title: 'Listings', icon: <Home size={14} />,
    fields: [
      { key: 'title',    label: 'Title',      type: 'text',   required: true },
      // Option values are the strings already stored in Supabase — only the labels are English.
      { key: 'type',     label: 'Type',       type: 'select', options: ['Venta', 'Alquiler'], optionLabels: LISTING_TYPE_LABELS },
      { key: 'price',    label: 'Price',      type: 'text' },
      { key: 'size_m2',  label: 'Size (m²)',  type: 'number' },
      { key: 'rooms',    label: 'Bedrooms',   type: 'number' },
      { key: 'location', label: 'Location',   type: 'text' },
    ],
  },
  gallery: {
    title: 'Showcase', icon: <Image size={14} />,
    fields: [
      { key: 'image_url', label: 'Image',    type: 'image' },
      { key: 'caption',   label: 'Caption',  type: 'text' },
      { key: 'category',  label: 'Category', type: 'text' },
    ],
  },
}

export default function ContenidoPage() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientSlug, setClientSlug] = useState<string>('')
  const [dynamicSections, setDynamicSections] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) setIsAdmin(true)

      const { data: client, error } = await supabase
        .from('clients').select('id, slug, dynamic_sections').eq('user_id', user.id).single()

      if (error) console.error('contenido fetch error:', error)
      if (client) {
        setClientId(client.id)
        setClientSlug(client.slug ?? '')
        setDynamicSections(client.dynamic_sections ?? [])
      }
      setLoading(false)
    }
    loadClient()
  }, [])

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F7F6F3' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main">
        <TopBar title="Content" />

        <div className="flex-1 p-6 max-w-5xl space-y-8">
          <div>
            <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
              Content
            </h2>
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
              Manage the dynamic content on your site
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl h-40" style={{ backgroundColor: '#F2F0EB' }} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {isAdmin && (
                <div
                  className="yele-card yele-card-lg overflow-hidden"
                  style={{ boxShadow: '0 0 0 1px rgba(212,111,200,0.25)' }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-3"
                    style={{ backgroundColor: 'rgba(212,111,200,0.08)', borderBottom: '1px solid rgba(212,111,200,0.2)' }}
                  >
                    <Image size={14} style={{ color: '#D46FC8' }} />
                    <span className="yele-eyebrow" style={{ color: '#8A5A16' }}>
                      Sample projects (Examples)
                    </span>
                  </div>
                  <div className="p-4">
                    <AdminShowcaseSection />
                  </div>
                </div>
              )}

              {!clientId ? null : dynamicSections.length === 0 && !isAdmin ? (
                <div className="yele-card-quiet p-8 text-center">
                  <p className="text-sm mb-1" style={{ fontFamily: 'var(--font-instrument)', color: '#16161A' }}>
                    No dynamic sections are set up yet.
                  </p>
                  <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                    Get in touch if you’d like to add this.
                  </p>
                </div>
              ) : (
                dynamicSections.map((sectionKey) => {
                  const config = SECTION_CONFIG[sectionKey]
                  if (!config) return null
                  return (
                    <CardManager
                      key={sectionKey}
                      sectionKey={sectionKey}
                      clientId={clientId!}
                      clientSlug={clientSlug}
                      title={config.title}
                      icon={config.icon}
                      fields={config.fields}
                    />
                  )
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
