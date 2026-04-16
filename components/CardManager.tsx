'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Star } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'url' | 'tel' | 'email' | 'date' | 'toggle' | 'select' | 'image'
  placeholder?: string
  options?: string[]
  required?: boolean
}

interface CardManagerProps {
  sectionKey: string
  clientId: string
  clientSlug?: string
  title: string
  icon?: React.ReactNode
  fields: FieldDef[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordData = Record<string, any>

function renderCard(sectionKey: string, item: RecordData) {
  switch (sectionKey) {
    case 'catalog_items':
      return (
        <div className="space-y-1.5">
          {item.category && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(45,63,82,0.6)', color: '#8A9BAD' }}
            >
              {String(item.category)}
            </span>
          )}
          <div className="font-semibold text-sm" style={{ color: '#F5F2EE' }}>{String(item.name || '')}</div>
          {item.description && (
            <div className="text-xs leading-relaxed" style={{ color: '#8A9BAD' }}>{String(item.description)}</div>
          )}
          <div className="flex items-center justify-between mt-2">
            {item.price && (
              <span className="text-sm font-semibold" style={{ color: '#E8A020' }}>{String(item.price)}</span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: item.available ? 'rgba(42,138,90,0.15)' : 'rgba(196,58,42,0.15)',
                color: item.available ? '#2A8A5A' : '#C43A2A',
              }}
            >
              {item.available ? 'Disponible' : 'No disponible'}
            </span>
          </div>
        </div>
      )

    case 'services':
      return (
        <div className="space-y-1.5">
          <div className="font-semibold text-sm" style={{ color: '#F5F2EE' }}>{String(item.name || '')}</div>
          {item.description && (
            <div className="text-xs leading-relaxed" style={{ color: '#8A9BAD' }}>{String(item.description)}</div>
          )}
          {(item.price || item.price_label) && (
            <div className="text-sm font-semibold" style={{ color: '#E8A020' }}>
              {String(item.price_label || item.price || '')}
            </div>
          )}
        </div>
      )

    case 'team_members':
      return (
        <div className="space-y-1">
          <div className="font-semibold text-sm" style={{ color: '#F5F2EE' }}>{String(item.name || '')}</div>
          {item.role && (
            <div className="text-xs" style={{ color: '#8A9BAD' }}>{String(item.role)}</div>
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
                fill={i < rating ? '#E8A020' : 'transparent'}
                strokeWidth={1.5}
                style={{ color: '#E8A020' }}
              />
            ))}
          </div>
          {item.body && (
            <div className="text-xs italic leading-relaxed" style={{ color: '#8A9BAD' }}>
              &ldquo;{String(item.body)}&rdquo;
            </div>
          )}
          <div className="text-xs font-medium" style={{ color: '#F5F2EE' }}>
            {String(item.author_name || '')}
            {item.author_role && (
              <span style={{ color: '#8A9BAD' }}> · {String(item.author_role)}</span>
            )}
          </div>
        </div>
      )
    }

    case 'faqs':
      return (
        <div className="space-y-1.5">
          <div className="font-semibold text-sm" style={{ color: '#F5F2EE' }}>{String(item.question || '')}</div>
          {item.answer && (
            <div
              className="text-xs leading-relaxed overflow-hidden"
              style={{ color: '#8A9BAD', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}
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
              style={{ backgroundColor: 'rgba(232,160,32,0.12)', color: '#E8A020' }}
            >
              {String(item.badge)}
            </span>
          )}
          <div className="font-semibold text-sm" style={{ color: '#F5F2EE' }}>{String(item.title || '')}</div>
          {item.description && (
            <div className="text-xs" style={{ color: '#8A9BAD' }}>{String(item.description)}</div>
          )}
          {item.valid_until && (
            <div className="text-xs" style={{ color: '#8A9BAD' }}>
              Válido hasta: {String(item.valid_until)}
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
                backgroundColor: item.type === 'Venta' ? 'rgba(42,138,90,0.12)' : 'rgba(107,168,212,0.12)',
                color: item.type === 'Venta' ? '#2A8A5A' : '#6BA8D4',
              }}
            >
              {String(item.type)}
            </span>
          )}
          <div className="font-semibold text-sm" style={{ color: '#F5F2EE' }}>{String(item.title || '')}</div>
          {item.price && (
            <div className="text-sm font-semibold" style={{ color: '#E8A020' }}>{String(item.price)}</div>
          )}
          <div className="flex gap-3 text-xs" style={{ color: '#8A9BAD' }}>
            {item.size_m2 && <span>{String(item.size_m2)} m²</span>}
            {item.rooms && <span>{String(item.rooms)} hab.</span>}
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
            <div className="text-xs" style={{ color: '#F5F2EE' }}>{String(item.caption)}</div>
          )}
          {item.category && (
            <div className="text-xs" style={{ color: '#8A9BAD' }}>{String(item.category)}</div>
          )}
        </div>
      )

    default:
      return (
        <div className="text-sm" style={{ color: '#F5F2EE' }}>
          {String(item.name || item.title || item.question || JSON.stringify(item))}
        </div>
      )
  }
}

const SAVED_NOTICE = 'Los cambios aparecerán en tu web en menos de 60 segundos.'

export default function CardManager({ sectionKey, clientId, clientSlug, title, icon, fields }: CardManagerProps) {
  const supabase = supabaseClient
  const [items, setItems] = useState<RecordData[]>([])
  const [loading, setLoading] = useState(true)
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
    if (editingItem) {
      const { error } = await supabase
        .from(sectionKey)
        .update(formData)
        .eq('id', editingItem.id as string)
      if (!error) { showToast(`✓ Elemento actualizado. ${SAVED_NOTICE}`); fetchItems() }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Inserting with client_id:', clientId)
      console.log('Auth user id:            ', user?.id)
      console.log('Are they different?      ', clientId !== user?.id)

      const { data, error } = await supabase
        .from(sectionKey)
        .insert({ ...formData, client_id: clientId })
        .select()
      if (error) {
        console.error('Full error:', JSON.stringify(error))
        alert('Error guardando: ' + error.message + ' — code: ' + error.code)
      } else {
        console.log('Insert success:', data)
        showToast(`✓ Elemento añadido. ${SAVED_NOTICE}`)
        fetchItems()
      }
    }
    setSaving(false)
    setPanelOpen(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from(sectionKey).delete().eq('id', id)
    if (!error) { showToast(`✓ Elemento eliminado. ${SAVED_NOTICE}`); fetchItems() }
    setConfirmDelete(null)
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
  }

  return (
    <div
      className="rounded-xl"
      style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(45,63,82,0.4)' }}
      >
        <div className="flex items-center gap-2">
          {icon && <span style={{ color: '#E8A020' }}>{icon}</span>}
          <h3 className="font-semibold text-sm" style={{ color: '#F5F2EE' }}>{title}</h3>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: 'rgba(45,63,82,0.6)', color: '#8A9BAD' }}
          >
            {items.length}
          </span>
        </div>
        <button
          onClick={openAddPanel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ backgroundColor: '#E8A020', color: '#0F1923' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B87A10' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E8A020' }}
        >
          <Plus size={14} />
          Añadir
        </button>
      </div>

      {/* Cards grid */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg" style={{ backgroundColor: '#2D3F52' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#8A9BAD' }}>No hay elementos todavía.</p>
            <button
              onClick={openAddPanel}
              className="mt-3 text-xs font-medium transition-colors"
              style={{ color: '#E8A020' }}
            >
              + Añadir el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={String(item.id)}
                className="rounded-lg p-4 relative group"
                style={{ backgroundColor: '#0F1923', border: '1px solid rgba(45,63,82,0.4)' }}
              >
                {renderCard(sectionKey, item)}
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditPanel(item)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(45,63,82,0.8)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(232,160,32,0.2)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(45,63,82,0.8)' }}
                  >
                    <Pencil size={12} style={{ color: '#8A9BAD' }} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(String(item.id))}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(45,63,82,0.8)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(196,58,42,0.2)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(45,63,82,0.8)' }}
                  >
                    <Trash2 size={12} style={{ color: '#8A9BAD' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
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
                backgroundColor: '#1E2B3A',
                borderLeft: '1px solid rgba(45,63,82,0.4)',
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(45,63,82,0.4)' }}
              >
                <h4 className="font-semibold text-sm" style={{ color: '#F5F2EE' }}>
                  {editingItem ? 'Editar elemento' : 'Añadir elemento'}
                </h4>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#8A9BAD' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F5F2EE' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8A9BAD' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Panel form */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: '#8A9BAD' }}
                    >
                      {field.label}
                      {field.required && <span style={{ color: '#E8A020' }}> *</span>}
                    </label>

                    {field.type === 'image' ? (
                      <ImageUpload
                        value={String(formData[field.key] ?? '')}
                        onChange={(url) => setFormData((p) => ({ ...p, [field.key]: url }))}
                        clientSlug={clientSlug ?? 'unknown'}
                        tableName={sectionKey}
                      />
                    ) : field.type === 'toggle' ? (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, [field.key]: !p[field.key] }))}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: '#F5F2EE' }}
                      >
                        <div
                          className="w-10 h-5 rounded-full transition-colors relative"
                          style={{ backgroundColor: formData[field.key] ? '#E8A020' : '#2D3F52' }}
                        >
                          <div
                            className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                            style={{
                              backgroundColor: '#fff',
                              transform: formData[field.key] ? 'translateX(22px)' : 'translateX(2px)',
                            }}
                          />
                        </div>
                        {formData[field.key] ? 'Sí' : 'No'}
                      </button>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={String(formData[field.key] ?? '')}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(45,63,82,0.6)' }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={String(formData[field.key] ?? '')}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="">Seleccionar…</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={String(formData[field.key] ?? '')}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(45,63,82,0.6)' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Panel footer */}
              <div
                className="p-5 flex gap-3 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(45,63,82,0.4)' }}
              >
                <button
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                  style={{ backgroundColor: '#E8A020', color: '#0F1923' }}
                  onMouseEnter={(e) => { if (!saving) e.currentTarget.style.backgroundColor = '#B87A10' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E8A020' }}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
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
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-xl p-6 w-full max-w-sm"
              style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
            >
              <h4 className="font-semibold mb-2" style={{ color: '#F5F2EE' }}>¿Eliminar este elemento?</h4>
              <p className="text-sm mb-5" style={{ color: '#8A9BAD' }}>Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: '#C43A2A', color: '#fff' }}
                >
                  Eliminar
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
            className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg max-w-sm"
            style={{
              backgroundColor: 'rgba(42,138,90,0.15)',
              border: '1px solid rgba(42,138,90,0.4)',
              color: '#2A8A5A',
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
