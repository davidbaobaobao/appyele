'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Star, GripVertical } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import { revalidateYeleSite } from '@/lib/revalidate'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'url' | 'tel' | 'email' | 'date' | 'toggle' | 'select' | 'image'
  placeholder?: string
  options?: string[]
  /** Display labels for `options`; the option *values* stay as stored in Supabase. */
  optionLabels?: Record<string, string>
  required?: boolean
}

interface CardManagerProps {
  sectionKey: string
  clientId: string
  clientSlug?: string
  title: string
  icon?: React.ReactNode
  fields: FieldDef[]
  useAdminApi?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordData = Record<string, any>

// `listings.type` is stored in Supabase as 'Venta' / 'Alquiler'; only the display changes.
const LISTING_TYPE_LABELS: Record<string, string> = { Venta: 'For sale', Alquiler: 'For rent' }

function renderCard(sectionKey: string, item: RecordData) {
  switch (sectionKey) {
    case 'catalog_items':
      return (
        <div className="space-y-1.5">
          {item.category && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(22,22,26,0.06)', color: '#8A8A92' }}
            >
              {String(item.category)}
            </span>
          )}
          <div className="font-semibold text-sm" style={{ color: '#16161A' }}>{String(item.name || '')}</div>
          {item.description && (
            <div className="text-xs leading-relaxed" style={{ color: '#8A8A92' }}>{String(item.description)}</div>
          )}
          <div className="flex items-center justify-between mt-2">
            {item.price && (
              <span className="text-sm font-semibold" style={{ color: '#D46FC8' }}>{String(item.price)}</span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: item.available ? 'rgba(31,122,85,0.08)' : 'rgba(179,56,43,0.09)',
                color: item.available ? '#1F7A55' : '#B3382B',
              }}
            >
              {item.available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      )

    case 'services':
      return (
        <div className="space-y-1.5">
          <div className="font-semibold text-sm" style={{ color: '#16161A' }}>{String(item.name || '')}</div>
          {item.description && (
            <div className="text-xs leading-relaxed" style={{ color: '#8A8A92' }}>{String(item.description)}</div>
          )}
          {(item.price || item.price_label) && (
            <div className="text-sm font-semibold" style={{ color: '#D46FC8' }}>
              {String(item.price_label || item.price || '')}
            </div>
          )}
        </div>
      )

    case 'team_members':
      return (
        <div className="space-y-1">
          <div className="font-semibold text-sm" style={{ color: '#16161A' }}>{String(item.name || '')}</div>
          {item.role && (
            <div className="text-xs" style={{ color: '#8A8A92' }}>{String(item.role)}</div>
          )}
        </div>
      )

    case 'testimonials': {
      const rating = Number(item.rating) || 5
      return (
        <div className="space-y-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < rating ? '#D46FC8' : 'transparent'}
                strokeWidth={1.5}
                style={{ color: '#D46FC8' }}
              />
            ))}
          </div>
          {item.body && (
            <div className="text-xs italic leading-relaxed" style={{ color: '#8A8A92' }}>
              &ldquo;{String(item.body)}&rdquo;
            </div>
          )}
          <div className="text-xs font-medium" style={{ color: '#16161A' }}>
            {String(item.author_name || '')}
            {item.role && (
              <span style={{ color: '#8A8A92' }}> · {String(item.role)}</span>
            )}
          </div>
        </div>
      )
    }

    case 'faqs':
      return (
        <div className="space-y-1.5">
          <div className="font-semibold text-sm" style={{ color: '#16161A' }}>{String(item.question || '')}</div>
          {item.answer && (
            <div
              className="text-xs leading-relaxed overflow-hidden"
              style={{ color: '#8A8A92', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}
            >
              {String(item.answer)}
            </div>
          )}
        </div>
      )

    case 'offers':
      return (
        <div className="space-y-1.5">
          {item.badge && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(212,111,200,0.12)', color: '#D46FC8' }}
            >
              {String(item.badge)}
            </span>
          )}
          <div className="font-semibold text-sm" style={{ color: '#16161A' }}>{String(item.title || '')}</div>
          {item.description && (
            <div className="text-xs" style={{ color: '#8A8A92' }}>{String(item.description)}</div>
          )}
          {item.valid_until && (
            <div className="text-xs" style={{ color: '#8A8A92' }}>
              Valid until: {String(item.valid_until)}
            </div>
          )}
        </div>
      )

    case 'listings':
      return (
        <div className="space-y-1.5">
          {item.type && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: item.type === 'Venta' ? 'rgba(31,122,85,0.08)' : 'rgba(43,79,168,0.08)',
                color: item.type === 'Venta' ? '#1F7A55' : '#2B4FA8',
              }}
            >
              {LISTING_TYPE_LABELS[String(item.type)] ?? String(item.type)}
            </span>
          )}
          <div className="font-semibold text-sm" style={{ color: '#16161A' }}>{String(item.title || '')}</div>
          {item.price && (
            <div className="text-sm font-semibold" style={{ color: '#D46FC8' }}>{String(item.price)}</div>
          )}
          <div className="flex gap-3 text-xs" style={{ color: '#8A8A92' }}>
            {item.size_m2 && <span>{String(item.size_m2)} m²</span>}
            {item.rooms && <span>{String(item.rooms)} bd</span>}
            {item.location && <span>{String(item.location)}</span>}
          </div>
        </div>
      )

    case 'gallery':
      return (
        <div className="space-y-1.5">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(item.image_url)}
              alt={String(item.caption || '')}
              className="w-full h-24 object-cover rounded-lg"
            />
          )}
          {item.caption && (
            <div className="text-xs" style={{ color: '#16161A' }}>{String(item.caption)}</div>
          )}
          {item.category && (
            <div className="text-xs" style={{ color: '#8A8A92' }}>{String(item.category)}</div>
          )}
        </div>
      )

    default:
      return (
        <div className="text-sm" style={{ color: '#16161A' }}>
          {String(item.name || item.title || item.question || JSON.stringify(item))}
        </div>
      )
  }
}

function SortableCard({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
        position: 'relative',
        boxShadow: isDragging ? '0 8px 24px rgba(22,22,26,0.12)' : 'none',
      }}
      className="group/sortable flex items-stretch gap-2"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          color: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
          padding: '0 2px',
          touchAction: 'none',
          transition: 'color 0.15s',
        }}
        className="opacity-0 group-hover/sortable:opacity-100 transition-opacity"
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(0,0,0,0.5)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(0,0,0,0.2)' }}
      >
        <GripVertical size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

const SAVED_NOTICE = 'Changes will show on your site within 60 seconds.'

export default function CardManager({ sectionKey, clientId, clientSlug, title, icon, fields, useAdminApi = false }: CardManagerProps) {
  const supabase = supabaseClient
  const [items, setItems] = useState<RecordData[]>([])
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RecordData | null>(null)
  const [formData, setFormData] = useState<RecordData>({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, duration = 8000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastMsg(msg)
    toastTimer.current = setTimeout(() => setToastMsg(null), duration)
  }, [])

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from(sectionKey)
      .select('*')
      .eq('client_id', clientId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    setItems(data ?? [])
    setLoading(false)
  }, [supabase, sectionKey, clientId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openAddPanel = () => {
    setEditingItem(null)
    const defaults: RecordData = {}
    fields.forEach((f) => {
      if (f.type === 'toggle') defaults[f.key] = true
      else defaults[f.key] = ''
    })
    setFormData(defaults)
    setPanelOpen(true)
  }

  const openEditPanel = (item: RecordData) => {
    setEditingItem(item)
    const prefilled: RecordData = {}
    fields.forEach((f) => { prefilled[f.key] = item[f.key] ?? (f.type === 'toggle' ? true : '') })
    setFormData(prefilled)
    setPanelOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)

    // Coerce number fields — form inputs always return strings
    const coercedData: RecordData = { ...formData }
    fields.forEach((f) => {
      if (f.type === 'number') {
        const parsed = parseInt(String(coercedData[f.key]))
        coercedData[f.key] = isNaN(parsed) ? (f.key === 'rating' ? 5 : 0) : parsed
      }
    })

    if (editingItem) {
      const { error } = await supabase
        .from(sectionKey)
        .update(coercedData)
        .eq('id', editingItem.id as string)
      if (!error) {
        showToast(`✓ Item updated. ${SAVED_NOTICE}`)
        fetchItems()
        revalidateYeleSite('/')
      }
    } else {
      const { error } = await supabase
        .from(sectionKey)
        .insert({ ...coercedData, client_id: clientId })
      if (error) {
        console.error('CardManager insert error:', JSON.stringify(error))
        alert("Couldn't save: " + error.message + ' — code: ' + error.code)
      } else {
        showToast(`✓ Item added. ${SAVED_NOTICE}`)
        fetchItems()
        revalidateYeleSite('/')
      }
    }
    setSaving(false)
    setPanelOpen(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from(sectionKey).delete().eq('id', id)
    if (!error) {
      showToast(`✓ Item deleted. ${SAVED_NOTICE}`)
      fetchItems()
      revalidateYeleSite('/')
    }
    setConfirmDelete(null)
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => String(i.id) === active.id)
    const newIndex = items.findIndex((i) => String(i.id) === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems) // optimistic

    await Promise.all(
      newItems.map((item, index) =>
        supabase
          .from(sectionKey)
          .update({ sort_order: index })
          .eq('id', item.id as string)
          .eq('client_id', clientId)
      )
    )

    showToast(`✓ Order saved. ${SAVED_NOTICE}`)
    revalidateYeleSite('/')
  }, [items, supabase, sectionKey, clientId, showToast])

  return (
    <div className="yele-card yele-card-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(22,22,26,0.06)' }}
      >
        <div className="flex items-center gap-2">
          {icon && <span style={{ color: '#D46FC8' }}>{icon}</span>}
          <h3 className="font-semibold text-sm" style={{ color: '#16161A', fontFamily: 'var(--font-display)' }}>{title}</h3>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: 'rgba(22,22,26,0.06)', color: '#8A8A92' }}
          >
            {items.length}
          </span>
        </div>
        <button onClick={openAddPanel} className="yele-btn yele-btn-primary">
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Cards grid */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#F2F0EB' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>No items yet.</p>
            <button onClick={openAddPanel} className="yele-btn yele-btn-ghost mt-3" style={{ color: '#D46FC8' }}>
              <Plus size={13} />
              Add the first one
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => String(item.id))}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <SortableCard key={String(item.id)} id={String(item.id)}>
                    <div className="yele-card-quiet p-4 relative group">
                      {renderCard(sectionKey, item)}
                      {/* Action buttons */}
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          aria-label="Edit"
                          onClick={() => openEditPanel(item)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ backgroundColor: 'rgba(22,22,26,0.06)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(212,111,200,0.15)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(22,22,26,0.06)' }}
                        >
                          <Pencil size={12} style={{ color: '#8A8A92' }} />
                        </button>
                        <button
                          aria-label="Delete"
                          onClick={() => setConfirmDelete(String(item.id))}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ backgroundColor: 'rgba(22,22,26,0.06)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(179,56,43,0.09)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(22,22,26,0.06)' }}
                        >
                          <Trash2 size={12} style={{ color: '#8A8A92' }} />
                        </button>
                      </div>
                    </div>
                  </SortableCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Slide-in panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              onClick={() => setPanelOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-y-auto"
              style={{
                width: '400px',
                backgroundColor: '#FFFFFF',
                borderLeft: '1px solid rgba(22,22,26,0.08)',
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(22,22,26,0.06)' }}
              >
                <h4 className="font-semibold text-sm" style={{ color: '#16161A', fontFamily: 'var(--font-display)' }}>
                  {editingItem ? 'Edit item' : 'Add item'}
                </h4>
                <button
                  aria-label="Close"
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#8A8A92' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#16161A' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A92' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Panel form */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="yele-label">
                      {field.label}
                      {field.required && <span style={{ color: '#D46FC8' }}> *</span>}
                    </label>

                    {field.type === 'image' ? (
                      <ImageUpload
                        value={String(formData[field.key] ?? '')}
                        onChange={(url) => setFormData((p) => ({ ...p, [field.key]: url }))}
                        clientSlug={clientSlug ?? 'unknown'}
                        tableName={sectionKey}
                        useAdminApi={useAdminApi}
                      />
                    ) : field.type === 'toggle' ? (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, [field.key]: !p[field.key] }))}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: '#16161A', fontFamily: 'var(--font-instrument)' }}
                      >
                        <div
                          className="w-10 h-5 rounded-full transition-colors relative"
                          style={{ backgroundColor: formData[field.key] ? '#16161A' : 'rgba(0,0,0,0.1)' }}
                        >
                          <div
                            className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                            style={{
                              backgroundColor: '#fff',
                              transform: formData[field.key] ? 'translateX(22px)' : 'translateX(2px)',
                            }}
                          />
                        </div>
                        {formData[field.key] ? 'Yes' : 'No'}
                      </button>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={String(formData[field.key] ?? '')}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                        className="yele-textarea"
                        style={{ resize: 'vertical' }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={String(formData[field.key] ?? '')}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="yele-select"
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">Select…</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{field.optionLabels?.[opt] ?? opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={String(formData[field.key] ?? '')}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="yele-input"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Panel footer */}
              <div
                className="p-5 flex gap-3 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(22,22,26,0.06)' }}
              >
                <button onClick={() => setPanelOpen(false)} className="yele-btn yele-btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="yele-btn yele-btn-primary flex-1">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="yele-card yele-card-lg p-6 w-full max-w-sm"
            >
              <h4 className="font-semibold mb-2" style={{ color: '#16161A', fontFamily: 'var(--font-display)' }}>Delete this item?</h4>
              <p className="text-sm mb-5" style={{ color: '#8A8A92', fontFamily: 'var(--font-instrument)' }}>This can’t be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="yele-btn yele-btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="yele-btn flex-1"
                  style={{ backgroundColor: '#B3382B', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium max-w-sm"
            style={{
              backgroundColor: 'rgba(31,122,85,0.08)',
              border: '1px solid rgba(31,122,85,0.2)',
              color: '#1F7A55',
              fontFamily: 'var(--font-instrument)',
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
