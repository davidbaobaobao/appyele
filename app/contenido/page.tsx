'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UtensilsCrossed, Briefcase, Users, Quote, HelpCircle, Tag, Home, Image, Plus, Trash2, Save, Eye, EyeOff, GripVertical, X } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import CardManager, { FieldDef } from '@/components/CardManager'

// ── Admin-only Showcase Section ───────────────────────────────────────────────

const SS = {
  card: { backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)', borderRadius: '12px', padding: '16px' },
  input: { backgroundColor: '#152030', border: '1px solid rgba(45,63,82,0.6)', color: '#F5F2EE', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', outline: 'none', width: '100%' },
  label: { color: '#8A9BAD', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block', marginBottom: '4px' },
  btnPrimary: { backgroundColor: '#E05A2B', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#F5F2EE', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  btnDanger: { backgroundColor: 'rgba(196,58,42,0.15)', color: '#C43A2A', border: '1px solid rgba(196,58,42,0.3)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' },
}

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
    return { name: '', description: '', main_image: '', additional_images: [], visible: true, sort_order: items.length }
  }

  function update(idx: number, patch: Partial<ShowcaseProject>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function save(idx: number) {
    const item = items[idx]
    setSaving(String(idx))
    const payload: Partial<ShowcaseProject> = {
      name: item.name,
      description: item.description,
      main_image: item.main_image,
      additional_images: item.additional_images,
      visible: item.visible,
      sort_order: item.sort_order,
    }
    if (item.id) payload.id = item.id
    const res = await fetch('/api/admin/showcase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const saved = await res.json()
    if (saved && !saved.error) {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...saved } : it))
    }
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
        <div key={item.id ?? idx} style={SS.card}>
          <div className="flex items-start gap-3">
            <GripVertical size={16} style={{ color: '#8A9BAD', marginTop: '2px', flexShrink: 0 }} />
            <div className="flex-1 grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={SS.label}>Nombre</label>
                  <input style={SS.input} value={item.name} onChange={e => update(idx, { name: e.target.value })} placeholder="El Taller · Cerámica, Gràcia" />
                </div>
                <div>
                  <label style={SS.label}>Descripción</label>
                  <input style={SS.input} value={item.description} onChange={e => update(idx, { description: e.target.value })} placeholder="Breve descripción" />
                </div>
              </div>
              <div>
                <ImageUploader
                  label="Imagen principal"
                  value={item.main_image}
                  onChange={url => update(idx, { main_image: url })}
                />
              </div>
              <div>
                <label style={SS.label}>Imágenes adicionales</label>
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
                        style={{ ...SS.btnDanger, padding: '6px', marginTop: '18px', flexShrink: 0 }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={{ ...SS.btnGhost, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => update(idx, { additional_images: [...item.additional_images, ''] })}
                  >
                    <Plus size={12} /> Añadir imagen
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label style={SS.label}>Orden</label>
                  <input type="number" style={{ ...SS.input, width: '70px' }} value={item.sort_order} onChange={e => update(idx, { sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-end gap-2 pb-0.5 mt-auto">
                  <button style={SS.btnGhost} onClick={() => update(idx, { visible: !item.visible })}>
                    {item.visible ? <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <EyeOff size={13} style={{ display: 'inline', marginRight: '4px' }} />}
                    {item.visible ? 'Visible' : 'Oculto'}
                  </button>
                  <button style={SS.btnPrimary} onClick={() => save(idx)} disabled={saving === String(idx)}>
                    <Save size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {saving === String(idx) ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button style={SS.btnDanger} onClick={() => remove(idx)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        style={{ ...SS.btnGhost, display: 'flex', alignItems: 'center', gap: '6px' }}
        onClick={() => setItems(prev => [...prev, newItem()])}
      >
        <Plus size={14} /> Añadir proyecto
      </button>
    </div>
  )
}

const SECTION_CONFIG: Record<string, { title: string; icon: React.ReactNode; fields: FieldDef[] }> = {
  catalog_items: {
    title: 'Carta / Catálogo',
    icon: <UtensilsCrossed size={14} />,
    fields: [
      { key: 'name',        label: 'Nombre',      type: 'text',     required: true, placeholder: 'Ej. Paella valenciana' },
      { key: 'category',   label: 'Categoría',   type: 'text',     placeholder: 'Ej. Arroces' },
      { key: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Describe el producto…' },
      { key: 'price',       label: 'Precio',      type: 'text',     placeholder: 'Ej. 14,50 €' },
      { key: 'image_url',   label: 'Imagen',      type: 'image' },
      { key: 'available',   label: 'Disponible',  type: 'toggle' },
    ],
  },
  services: {
    title: 'Servicios',
    icon: <Briefcase size={14} />,
    fields: [
      { key: 'name',        label: 'Nombre del servicio', type: 'text',     required: true },
      { key: 'description', label: 'Descripción',         type: 'textarea' },
      { key: 'price',       label: 'Precio',              type: 'text',     placeholder: 'Ej. Desde 50 €' },
      { key: 'price_label', label: 'Etiqueta de precio',  type: 'text',     placeholder: 'Ej. Consultar' },
    ],
  },
  team_members: {
    title: 'Equipo',
    icon: <Users size={14} />,
    fields: [
      { key: 'name',      label: 'Nombre',    type: 'text', required: true },
      { key: 'role',      label: 'Cargo',     type: 'text' },
      { key: 'photo_url', label: 'Foto',  type: 'image' },
    ],
  },
  testimonials: {
    title: 'Testimonios',
    icon: <Quote size={14} />,
    fields: [
      { key: 'author_name', label: 'Nombre del autor', type: 'text',     required: true },
      { key: 'role',        label: 'Cargo del autor',  type: 'text' },
      { key: 'body',        label: 'Testimonio',        type: 'textarea', required: true },
      { key: 'rating',      label: 'Valoración (1–5)', type: 'number',   placeholder: '5' },
    ],
  },
  faqs: {
    title: 'Preguntas frecuentes',
    icon: <HelpCircle size={14} />,
    fields: [
      { key: 'question', label: 'Pregunta',  type: 'text',     required: true },
      { key: 'answer',   label: 'Respuesta', type: 'textarea', required: true },
    ],
  },
  offers: {
    title: 'Ofertas',
    icon: <Tag size={14} />,
    fields: [
      { key: 'title',       label: 'Título',            type: 'text',     required: true },
      { key: 'badge',       label: 'Etiqueta (badge)',  type: 'text',     placeholder: 'Ej. -20%' },
      { key: 'description', label: 'Descripción',       type: 'textarea' },
      { key: 'valid_until', label: 'Válido hasta',      type: 'date' },
    ],
  },
  listings: {
    title: 'Inmuebles',
    icon: <Home size={14} />,
    fields: [
      { key: 'title',    label: 'Título',          type: 'text',   required: true },
      { key: 'type',     label: 'Tipo',            type: 'select', options: ['Venta', 'Alquiler'] },
      { key: 'price',    label: 'Precio',          type: 'text' },
      { key: 'size_m2',  label: 'Superficie (m²)', type: 'number' },
      { key: 'rooms',    label: 'Habitaciones',    type: 'number' },
      { key: 'location', label: 'Ubicación',       type: 'text' },
    ],
  },
  gallery: {
    title: 'Galería',
    icon: <Image size={14} />,
    fields: [
      { key: 'image_url', label: 'Imagen', type: 'image' },
      { key: 'caption',   label: 'Descripción',   type: 'text' },
      { key: 'category',  label: 'Categoría',     type: 'text' },
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

      if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true)
      }

      const { data: client, error } = await supabase
        .from('clients')
        .select('id, slug, dynamic_sections')
        .eq('user_id', user.id)
        .single()

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
    <div className="flex min-h-screen" style={{ backgroundColor: '#0F1923' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col" style={{ marginLeft: '220px' }}>
        <TopBar title="Contenido" />

        <div className="flex-1 p-6 max-w-5xl space-y-8">
          <div>
            <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}>
              Contenido
            </h2>
            <p className="text-sm" style={{ color: '#8A9BAD' }}>
              Gestiona el contenido dinámico de tu web
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl h-40" style={{ backgroundColor: '#1E2B3A' }} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {isAdmin && (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(224,90,43,0.3)', backgroundColor: '#1A2536' }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-3"
                    style={{ backgroundColor: 'rgba(224,90,43,0.1)', borderBottom: '1px solid rgba(224,90,43,0.2)' }}
                  >
                    <Image size={14} style={{ color: '#E05A2B' }} />
                    <span className="text-sm font-semibold" style={{ color: '#E05A2B' }}>
                      Proyectos de ejemplo (Ejemplos)
                    </span>
                  </div>
                  <div className="p-4">
                    <AdminShowcaseSection />
                  </div>
                </div>
              )}

              {!clientId ? null : dynamicSections.length === 0 && !isAdmin ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
                >
                  <p className="text-sm mb-1" style={{ color: '#F5F2EE' }}>
                    No tienes secciones dinámicas configuradas.
                  </p>
                  <p className="text-sm" style={{ color: '#8A9BAD' }}>
                    Escríbenos si quieres añadir esta funcionalidad.
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
