'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, GripVertical, Package } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
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

export interface Product {
  id: string
  store_id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  price_cents: number
  compare_at_cents: number | null
  images: string[] | null
  track_inventory: boolean
  stock: number
  featured: boolean
  active: boolean
  sort_order: number | null
}

interface Props {
  storeId: string
  clientSlug: string
  currency: string
}

interface FormState {
  name: string
  description: string
  category: string
  price: string
  compareAt: string
  images: string[]
  track_inventory: boolean
  stock: string
  featured: boolean
  active: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  category: '',
  price: '',
  compareAt: '',
  images: [],
  track_inventory: false,
  stock: '0',
  featured: false,
  active: true,
}

const SAVED_NOTICE = 'Your changes will appear on your store in under 60 seconds.'
const REQUIRED_MSG = 'This field is required'

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'product'
}

function makeFormatter(currency: string) {
  const code = (currency || 'eur').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code })
  } catch {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' })
  }
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

function centsToUnits(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  return String(cents / 100)
}

function unitsToCents(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = parseFloat(trimmed.replace(',', '.'))
  if (isNaN(parsed)) return null
  return Math.round(parsed * 100)
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  input: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.08)',
    color: '#1D1D1F',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    fontFamily: 'var(--font-instrument)',
  } as const,
  label: {
    color: '#86868B',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: '6px',
    fontFamily: 'var(--font-instrument)',
  },
  pill: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: '9999px',
    whiteSpace: 'nowrap' as const,
    fontFamily: 'var(--font-instrument)',
  },
}

const PILL_GREEN = { backgroundColor: 'rgba(6,95,70,0.08)', color: '#065f46' }
const PILL_AMBER = { backgroundColor: 'rgba(180,120,40,0.10)', color: '#92400e' }
const PILL_RED = { backgroundColor: 'rgba(153,27,27,0.08)', color: '#991b1b' }
const PILL_GREY = { backgroundColor: 'rgba(0,0,0,0.06)', color: '#86868B' }

// ── Sortable wrapper ──────────────────────────────────────────────────────────

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
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
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
      }}
      className="group/sortable flex items-stretch gap-2"
    >
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
        onMouseEnter={(e) => { e.currentTarget.style.color = '#1D1D1F' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(0,0,0,0.2)' }}
      >
        <GripVertical size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-sm"
      style={{ color: '#1D1D1F', fontFamily: 'var(--font-instrument)' }}
    >
      <div
        className="w-10 h-5 rounded-full transition-colors relative"
        style={{ backgroundColor: value ? '#1D1D1F' : 'rgba(0,0,0,0.12)' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            backgroundColor: '#FFFFFF',
            transform: value ? 'translateX(22px)' : 'translateX(2px)',
          }}
        />
      </div>
      {value ? 'Yes' : 'No'}
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function StoreProductManager({ storeId, clientSlug, currency }: Props) {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const money = makeFormatter(currency)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success', duration = 8000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }, [])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('products fetch error:', error)
      showToast('We could not load your products. Please try again.', 'error')
    }
    setItems((data as Product[]) ?? [])
    setLoading(false)
  }, [storeId, showToast])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── Panel ──

  const openAdd = () => {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setPanelOpen(true)
  }

  const openEdit = (item: Product) => {
    setEditingItem(item)
    setForm({
      name: item.name ?? '',
      description: item.description ?? '',
      category: item.category ?? '',
      price: centsToUnits(item.price_cents),
      compareAt: centsToUnits(item.compare_at_cents),
      images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
      track_inventory: !!item.track_inventory,
      stock: String(item.stock ?? 0),
      featured: !!item.featured,
      active: item.active !== false,
    })
    setErrors({})
    setPanelOpen(true)
  }

  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }))

  // ── Save ──

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = REQUIRED_MSG
    if (unitsToCents(form.price) === null) next.price = REQUIRED_MSG
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const buildPayload = () => {
    const priceCents = unitsToCents(form.price) ?? 0
    const compareCents = unitsToCents(form.compareAt)
    const stock = parseInt(form.stock, 10)

    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      price_cents: priceCents,
      compare_at_cents: compareCents,
      images: form.images.filter(Boolean),
      track_inventory: form.track_inventory,
      stock: form.track_inventory ? (isNaN(stock) ? 0 : stock) : 0,
      featured: form.featured,
      active: form.active,
    }
  }

  const insertWithUniqueSlug = async (payload: ReturnType<typeof buildPayload>, sortOrder: number) => {
    const base = slugify(payload.name)

    for (let attempt = 1; attempt <= 25; attempt++) {
      const slug = attempt === 1 ? base : `${base}-${attempt}`
      const { error } = await supabase
        .from('products')
        .insert({ ...payload, store_id: storeId, slug, sort_order: sortOrder })

      if (!error) return null
      if (error.code !== '23505') return error
    }

    return { message: 'Could not find a free slug', code: '23505' }
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const payload = buildPayload()

    if (editingItem) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingItem.id)

      if (error) {
        console.error('product update error:', error)
        showToast('We could not save this product. Please try again.', 'error')
        setSaving(false)
        return
      }
      showToast(`✓ Product updated. ${SAVED_NOTICE}`)
    } else {
      const { data: maxRow } = await supabase
        .from('products')
        .select('sort_order')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: false, nullsFirst: false })
        .limit(1)

      const sortOrder = (maxRow?.[0]?.sort_order ?? 0) + 1
      const error = await insertWithUniqueSlug(payload, sortOrder)

      if (error) {
        console.error('product insert error:', error)
        showToast('We could not add this product. Please try again.', 'error')
        setSaving(false)
        return
      }
      showToast(`✓ Product added. ${SAVED_NOTICE}`)
    }

    await fetchItems()
    setSaving(false)
    setPanelOpen(false)
  }

  const handleDelete = async (item: Product) => {
    const { error } = await supabase.from('products').delete().eq('id', item.id)
    setConfirmDelete(null)

    if (error) {
      console.error('product delete error:', error)
      showToast('We could not delete this product. Please try again.', 'error')
      return
    }
    showToast(`✓ Product deleted. ${SAVED_NOTICE}`)
    fetchItems()
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered) // optimistic

    const results = await Promise.all(
      reordered.map((item, index) =>
        supabase
          .from('products')
          .update({ sort_order: index })
          .eq('id', item.id)
          .eq('store_id', storeId)
      )
    )

    if (results.some((r) => r.error)) {
      console.error('product reorder error:', results.map((r) => r.error).filter(Boolean))
      showToast('We could not save the new order. Please try again.', 'error')
      fetchItems()
      return
    }
    showToast(`✓ Order saved. ${SAVED_NOTICE}`)
  }, [items, storeId, showToast, fetchItems])

  // ── Card ──

  const renderCard = (item: Product) => {
    const thumb = Array.isArray(item.images) ? item.images.find(Boolean) : null
    const stock = item.stock ?? 0
    const stockStyle = stock === 0 ? PILL_RED : stock <= 5 ? PILL_AMBER : PILL_GREEN

    return (
      <div className="flex items-center gap-3">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={item.name}
            style={{
              width: 56,
              height: 56,
              objectFit: 'cover',
              borderRadius: '12px',
              flexShrink: 0,
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center text-xs font-semibold"
            style={{
              width: 56,
              height: 56,
              borderRadius: '12px',
              flexShrink: 0,
              backgroundColor: 'rgba(0,0,0,0.06)',
              color: '#86868B',
              border: '1px solid rgba(0,0,0,0.06)',
              fontFamily: 'var(--font-instrument)',
            }}
          >
            {initialsOf(item.name)}
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-semibold text-sm truncate"
              style={{ color: '#1D1D1F', fontFamily: 'var(--font-outfit)' }}
            >
              {item.name}
            </span>
            {item.category && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: '#86868B' }}
              >
                {item.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#C8A97E' }}>
              {money.format((item.price_cents ?? 0) / 100)}
            </span>
            {item.compare_at_cents ? (
              <span
                className="text-xs line-through"
                style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}
              >
                {money.format(item.compare_at_cents / 100)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span style={{ ...S.pill, ...(item.active ? PILL_GREEN : PILL_GREY) }}>
              {item.active ? 'Visible' : 'Hidden'}
            </span>
            {item.track_inventory && (
              <span style={{ ...S.pill, ...stockStyle }}>
                {stock === 0 ? 'Sold out' : `${stock} in stock`}
              </span>
            )}
            {item.featured && (
              <span style={{ ...S.pill, backgroundColor: 'rgba(200,169,126,0.12)', color: '#92400e' }}>
                Featured
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ──

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Package size={14} style={{ color: '#C8A97E' }} />
          <h3 className="font-semibold text-sm" style={{ color: '#1D1D1F', fontFamily: 'var(--font-outfit)' }}>
            Products
          </h3>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: '#86868B' }}
          >
            {items.length}
          </span>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1D1D1F' }}
        >
          <Plus size={14} />
          Add product
        </button>
      </div>

      {/* List */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: '#F5F5F7' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>
              You have no products yet.
            </p>
            <button
              onClick={openAdd}
              className="mt-3 text-xs font-medium transition-colors"
              style={{ color: '#C8A97E', fontFamily: 'var(--font-instrument)' }}
            >
              + Add your first product
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <SortableRow key={item.id} id={item.id}>
                    <div
                      className="rounded-xl p-4 relative group"
                      style={{ backgroundColor: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      {renderCard(item)}
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit"
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)' }}
                        >
                          <Pencil size={12} style={{ color: '#86868B' }} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(item)}
                          title="Delete"
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(153,27,27,0.12)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)' }}
                        >
                          <Trash2 size={12} style={{ color: '#86868B' }} />
                        </button>
                      </div>
                    </div>
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Slide-in edit panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 h-full z-50 flex flex-col"
              style={{
                width: '400px',
                maxWidth: '100vw',
                backgroundColor: '#FFFFFF',
                borderLeft: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
              >
                <h4 className="font-semibold text-sm" style={{ color: '#1D1D1F', fontFamily: 'var(--font-outfit)' }}>
                  {editingItem ? 'Edit product' : 'Add product'}
                </h4>
                <button
                  onClick={() => setPanelOpen(false)}
                  title="Close"
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#86868B' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#1D1D1F' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#86868B' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                {/* Name */}
                <div>
                  <label style={S.label}>Name<span style={{ color: '#C8A97E' }}> *</span></label>
                  <input
                    style={{ ...S.input, borderColor: errors.name ? '#fecaca' : 'rgba(0,0,0,0.08)' }}
                    value={form.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="e.g. Business Website"
                    onFocus={(e) => { if (!errors.name) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)' }}
                    onBlur={(e) => { if (!errors.name) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
                  />
                  {errors.name && (
                    <p className="text-xs mt-1" style={{ color: '#991b1b', fontFamily: 'var(--font-instrument)' }}>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label style={S.label}>Description</label>
                  <textarea
                    style={{ ...S.input, resize: 'vertical' }}
                    rows={3}
                    value={form.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="Describe this product…"
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={S.label}>Category</label>
                  <input
                    style={S.input}
                    value={form.category}
                    onChange={(e) => patch({ category: e.target.value })}
                    placeholder="e.g. Websites"
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
                  />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={S.label}>Price<span style={{ color: '#C8A97E' }}> *</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      style={{ ...S.input, borderColor: errors.price ? '#fecaca' : 'rgba(0,0,0,0.08)' }}
                      value={form.price}
                      onChange={(e) => patch({ price: e.target.value })}
                      placeholder="1190"
                    />
                    {errors.price && (
                      <p className="text-xs mt-1" style={{ color: '#991b1b', fontFamily: 'var(--font-instrument)' }}>
                        {errors.price}
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={S.label}>Compare-at price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      style={S.input}
                      value={form.compareAt}
                      onChange={(e) => patch({ compareAt: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label style={S.label}>Images</label>
                  <p className="text-xs mb-2" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>
                    The first image is used as the store thumbnail.
                  </p>
                  <div className="space-y-2">
                    {form.images.map((url, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <ImageUpload
                            value={url}
                            onChange={(newUrl) => {
                              const next = [...form.images]
                              next[idx] = newUrl
                              patch({ images: next })
                            }}
                            clientSlug={clientSlug || 'unknown'}
                            tableName="products"
                          />
                        </div>
                        <button
                          type="button"
                          title="Remove image"
                          onClick={() => patch({ images: form.images.filter((_, i) => i !== idx) })}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => patch({ images: [...form.images, ''] })}
                      className="flex items-center gap-1.5"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#1D1D1F',
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: '10px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-instrument)',
                      }}
                    >
                      <Plus size={12} /> Add image
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div>
                  <label style={S.label}>Track stock</label>
                  <Toggle value={form.track_inventory} onChange={(v) => patch({ track_inventory: v })} />
                </div>

                {form.track_inventory && (
                  <div>
                    <label style={S.label}>Stock</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      style={S.input}
                      value={form.stock}
                      onChange={(e) => patch({ stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                )}

                <div>
                  <label style={S.label}>Featured</label>
                  <Toggle value={form.featured} onChange={(v) => patch({ featured: v })} />
                </div>

                <div>
                  <label style={S.label}>Visible in store</label>
                  <Toggle value={form.active} onChange={(v) => patch({ active: v })} />
                </div>
              </div>

              <div className="p-5 flex gap-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#86868B',
                    fontFamily: 'var(--font-instrument)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
                  style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
                  onMouseEnter={(e) => { if (!saving) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1D1D1F' }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <h4 className="font-semibold mb-2" style={{ color: '#1D1D1F', fontFamily: 'var(--font-outfit)' }}>
                Delete this product?
              </h4>
              <p className="text-sm mb-5" style={{ color: '#86868B', fontFamily: 'var(--font-instrument)' }}>
                &ldquo;{confirmDelete.name}&rdquo; will be removed from your store. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#86868B',
                    fontFamily: 'var(--font-instrument)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ backgroundColor: '#991b1b', color: '#FFFFFF', fontFamily: 'var(--font-instrument)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7f1d1d' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#991b1b' }}
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
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-5 right-5 z-[70] px-4 py-3 rounded-xl text-sm font-medium max-w-sm"
            style={{
              backgroundColor: toast.type === 'success' ? 'rgba(6,95,70,0.08)' : 'rgba(153,27,27,0.08)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(6,95,70,0.2)' : 'rgba(153,27,27,0.2)'}`,
              color: toast.type === 'success' ? '#065f46' : '#991b1b',
              fontFamily: 'var(--font-instrument)',
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
