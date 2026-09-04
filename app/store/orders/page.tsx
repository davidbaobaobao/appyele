'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Receipt, Truck } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import StoreTabs from '@/components/StoreTabs'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Store {
  id: string
  currency: string
}

interface ShippingAddress {
  name?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

interface Order {
  id: string
  order_number: string
  email: string | null
  name: string | null
  status: string
  total_cents: number
  shipping_address: ShippingAddress | null
  tracking_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  created_at: string
}

interface OrderItem {
  id: string
  name: string
  variant_name: string | null
  unit_price_cents: number
  quantity: number
  image_url: string | null
}

interface OrderEvent {
  id: string
  status: string
  message: string | null
  created_at: string
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Incomplete',
  paid: 'Paid',
  processing: 'In progress',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const MANAGEABLE_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

const GREEN = { backgroundColor: 'rgba(31,122,85,0.08)', color: '#1F7A55' }
const BLUE = { backgroundColor: 'rgba(43,79,168,0.08)', color: '#2B4FA8' }
const RED = { backgroundColor: 'rgba(153,27,27,0.08)', color: '#B3382B' }
const GREY = { backgroundColor: 'rgba(22,22,26,0.06)', color: '#8A8A92' }

const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  pending: GREY,
  paid: GREEN,
  delivered: GREEN,
  processing: BLUE,
  shipped: BLUE,
  cancelled: RED,
  refunded: RED,
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? GREY
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFormatter(currency: string) {
  const code = (currency || 'eur').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code })
  } catch {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' })
  }
}

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const DATETIME_FMT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function addressLines(address: ShippingAddress | null): string[] {
  if (!address || typeof address !== 'object') return []
  const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ')
  const regionLine = [address.state, address.country].filter(Boolean).join(', ')
  return [address.line1, address.line2, cityLine, regionLine].filter(
    (line): line is string => !!line && line.trim().length > 0
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  body: { fontFamily: 'var(--font-instrument)' },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StoreOrdersPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [showIncomplete, setShowIncomplete] = useState(false)

  const [selected, setSelected] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const [statusDraft, setStatusDraft] = useState('paid')
  const [messageDraft, setMessageDraft] = useState('')
  const [carrierDraft, setCarrierDraft] = useState('')
  const [numberDraft, setNumberDraft] = useState('')
  const [urlDraft, setUrlDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success', duration = 8000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }, [])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // Load store

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (clientError) console.error('orders: client fetch error:', clientError)
        if (!client) return

        const { data: storeRow, error: storeError } = await supabase
          .from('stores')
          .select('id, currency')
          .eq('client_id', client.id)
          .maybeSingle()

        if (storeError) console.error('orders: store fetch error:', storeError)
        if (storeRow) setStore(storeRow as Store)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load orders

  const fetchOrders = useCallback(async (storeId: string, includeIncomplete: boolean) => {
    setOrdersLoading(true)
    let query = supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (!includeIncomplete) query = query.neq('status', 'pending')

    const { data, error } = await query
    if (error) {
      console.error('orders fetch error:', error)
      showToast('We could not load your orders. Please try again.', 'error')
    }
    setOrders((data as Order[]) ?? [])
    setOrdersLoading(false)
  }, [showToast])

  useEffect(() => {
    if (store) fetchOrders(store.id, showIncomplete)
  }, [store, showIncomplete, fetchOrders])

  const money = makeFormatter(store?.currency ?? 'eur')

  // Detail panel

  const openOrder = async (order: Order) => {
    setSelected(order)
    setStatusDraft(MANAGEABLE_STATUSES.includes(order.status) ? order.status : 'paid')
    setMessageDraft('')
    setCarrierDraft(order.tracking_carrier ?? '')
    setNumberDraft(order.tracking_number ?? '')
    setUrlDraft(order.tracking_url ?? '')
    setItems([])
    setEvents([])
    setDetailLoading(true)

    const [itemsRes, eventsRes] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', order.id),
      supabase
        .from('order_events')
        .select('id, status, message, created_at')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true }),
    ])

    if (itemsRes.error) console.error('order_items fetch error:', itemsRes.error)
    if (eventsRes.error) console.error('order_events fetch error:', eventsRes.error)

    setItems((itemsRes.data as OrderItem[]) ?? [])
    setEvents((eventsRes.data as OrderEvent[]) ?? [])
    setDetailLoading(false)
  }

  const handleSave = async () => {
    if (!selected || !store) return
    setSaving(true)

    const statusChanged = statusDraft !== selected.status
    const message = messageDraft.trim()

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: statusDraft,
        tracking_carrier: carrierDraft.trim() || null,
        tracking_number: numberDraft.trim() || null,
        tracking_url: urlDraft.trim() || null,
      })
      .eq('id', selected.id)

    if (updateError) {
      console.error('order update error:', updateError)
      showToast('We could not update this order. Please try again.', 'error')
      setSaving(false)
      return
    }

    if (statusChanged || message) {
      const { error: eventError } = await supabase.from('order_events').insert({
        order_id: selected.id,
        store_id: store.id,
        status: statusDraft,
        message: message || null,
      })

      if (eventError) {
        console.error('order_events insert error:', eventError)
        showToast('The order was updated, but we could not add it to the customer timeline.', 'error')
        setSaving(false)
        await fetchOrders(store.id, showIncomplete)
        setSelected(null)
        return
      }
    }

    showToast('✓ Order updated. The customer will see it on their tracking page.')
    await fetchOrders(store.id, showIncomplete)
    setSaving(false)
    setSelected(null)
  }

  // ── Render ──

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main">
        <TopBar title="Store" />

        <div className="flex-1 p-6 max-w-5xl space-y-6">
          <div>
            <h2
              className="text-3xl font-semibold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}
            >
              Store
            </h2>
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
              Manage the products and orders of your online store
            </p>
          </div>

          <StoreTabs />

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl h-40" style={{ backgroundColor: '#F2F0EB' }} />
              ))}
            </div>
          ) : !store ? (
            <div className="yele-card-quiet p-8 text-center">
              <p className="text-sm mb-1" style={{ ...S.body, color: '#16161A' }}>
                Your account does not have an online store yet.
              </p>
              <p className="text-sm" style={{ ...S.body, color: '#8A8A92' }}>
                Get in touch with us if you want to add this feature.
              </p>
            </div>
          ) : (
            <div className="yele-card overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(22,22,26,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <Receipt size={14} style={{ color: '#D46FC8' }} />
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: '#16161A', fontFamily: 'var(--font-display)' }}
                  >
                    Orders
                  </h3>
                  <span
                    className="yele-eyebrow px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(22,22,26,0.06)' }}
                  >
                    {orders.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowIncomplete((v) => !v)}
                  className="yele-btn yele-btn-ghost"
                  style={{ color: showIncomplete ? '#16161A' : '#8A8A92' }}
                >
                  {showIncomplete ? 'Hide incomplete' : 'Show incomplete'}
                </button>
              </div>

              {/* List */}
              <div className="p-4">
                {ordersLoading ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: '#F2F0EB' }} />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm" style={{ ...S.body, color: '#16161A' }}>No orders yet.</p>
                    <p className="text-sm mt-1" style={{ ...S.body, color: '#8A8A92' }}>
                      Orders placed in your store will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => openOrder(order)}
                        className="yele-card-quiet w-full text-left p-4 transition-shadow"
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 0 1px rgba(22,22,26,0.18)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-semibold text-sm"
                                style={{ color: '#16161A', fontFamily: 'var(--font-mono)' }}
                              >
                                {order.order_number}
                              </span>
                              <span className="yele-pill" style={statusStyle(order.status)}>
                                {statusLabel(order.status)}
                              </span>
                            </div>
                            <div className="text-xs mt-1 truncate" style={{ ...S.body, color: '#8A8A92' }}>
                              {DATE_FMT.format(new Date(order.created_at))}
                              {order.email ? ` · ${order.email}` : ''}
                            </div>
                          </div>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: '#D46FC8', fontFamily: 'var(--font-mono)' }}
                          >
                            {money.format((order.total_cents ?? 0) / 100)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 h-full z-50 flex flex-col"
              style={{
                width: '440px',
                maxWidth: '100vw',
                backgroundColor: '#FFFFFF',
                borderLeft: '1px solid rgba(22,22,26,0.08)',
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(22,22,26,0.06)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <h4
                    className="font-semibold text-sm truncate"
                    style={{ color: '#16161A', fontFamily: 'var(--font-mono)' }}
                  >
                    {selected.order_number}
                  </h4>
                  <span className="yele-pill" style={statusStyle(selected.status)}>
                    {statusLabel(selected.status)}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  title="Close"
                  className="yele-btn yele-btn-ghost flex-shrink-0"
                  style={{ padding: '6px', color: '#8A8A92' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#16161A' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A92' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 p-5 space-y-6 overflow-y-auto">
                {/* Customer */}
                <div>
                  <label className="yele-eyebrow block mb-2">Customer</label>
                  <div className="text-sm" style={{ ...S.body, color: '#16161A' }}>{selected.name || '—'}</div>
                  <div className="text-xs mt-0.5" style={{ ...S.body, color: '#8A8A92' }}>{selected.email || '—'}</div>
                  <div className="yele-eyebrow mt-1.5">
                    {DATETIME_FMT.format(new Date(selected.created_at))}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="yele-eyebrow block mb-2">Items</label>
                  {detailLoading ? (
                    <div className="flex flex-col gap-2 animate-pulse">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-12 rounded-xl" style={{ backgroundColor: '#F2F0EB' }} />
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <p className="text-sm" style={{ ...S.body, color: '#8A8A92' }}>No items on this order.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="yele-card-quiet flex items-center gap-3 p-3"
                        >
                          {item.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image_url}
                              alt={item.name}
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: 'cover',
                                borderRadius: '8px',
                                flexShrink: 0,
                                border: '1px solid rgba(22,22,26,0.06)',
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate" style={{ ...S.body, color: '#16161A' }}>{item.name}</div>
                            <div className="text-xs" style={{ color: '#8A8A92', fontFamily: 'var(--font-mono)' }}>
                              {item.variant_name ? `${item.variant_name} · ` : ''}
                              {item.quantity} × {money.format((item.unit_price_cents ?? 0) / 100)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className="flex items-center justify-between mt-3 pt-3 text-sm"
                    style={{ borderTop: '1px solid rgba(22,22,26,0.06)', ...S.body, color: '#16161A' }}
                  >
                    <span className="font-semibold">Total</span>
                    <span
                      className="font-semibold"
                      style={{ color: '#D46FC8', fontFamily: 'var(--font-mono)' }}
                    >
                      {money.format((selected.total_cents ?? 0) / 100)}
                    </span>
                  </div>
                </div>

                {/* Shipping address */}
                {addressLines(selected.shipping_address).length > 0 && (
                  <div>
                    <label className="yele-eyebrow block mb-2">Shipping address</label>
                    <div className="text-sm leading-relaxed" style={{ ...S.body, color: '#16161A' }}>
                      {selected.shipping_address?.name && <div>{selected.shipping_address.name}</div>}
                      {addressLines(selected.shipping_address).map((line, i) => (
                        <div key={i} style={{ color: '#8A8A92' }}>{line}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <label className="yele-eyebrow block mb-2">Customer timeline</label>
                  {detailLoading ? (
                    <div className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: '#F2F0EB' }} />
                  ) : events.length === 0 ? (
                    <p className="text-sm" style={{ ...S.body, color: '#8A8A92' }}>
                      Nothing on the timeline yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="yele-card-quiet p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="yele-pill" style={statusStyle(event.status)}>
                              {statusLabel(event.status)}
                            </span>
                            <span className="yele-eyebrow">
                              {DATETIME_FMT.format(new Date(event.created_at))}
                            </span>
                          </div>
                          {event.message && (
                            <p className="text-xs mt-2 leading-relaxed" style={{ ...S.body, color: '#8A8A92' }}>
                              {event.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Management block */}
                <div className="pt-5 space-y-4" style={{ borderTop: '1px solid rgba(22,22,26,0.06)' }}>
                  <div>
                    <label className="yele-label">Status</label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value)}
                      className="yele-select"
                      style={{ cursor: 'pointer' }}
                    >
                      {MANAGEABLE_STATUSES.map((status) => (
                        <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="yele-label">Message for the customer</label>
                    <textarea
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      rows={3}
                      className="yele-textarea"
                      style={{ resize: 'vertical' }}
                      placeholder="Optional — shown on the customer tracking page"
                    />
                  </div>

                  <div>
                    <label className="yele-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={12} /> Tracking
                    </label>
                    <div className="space-y-2">
                      <input
                        className="yele-input"
                        value={carrierDraft}
                        onChange={(e) => setCarrierDraft(e.target.value)}
                        placeholder="Carrier"
                      />
                      <input
                        className="yele-input"
                        value={numberDraft}
                        onChange={(e) => setNumberDraft(e.target.value)}
                        placeholder="Tracking number"
                      />
                      <input
                        className="yele-input"
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        placeholder="Tracking URL"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel footer */}
              <div
                className="p-5 flex gap-3 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(22,22,26,0.06)' }}
              >
                <button
                  onClick={() => setSelected(null)}
                  className="yele-btn yele-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="yele-btn yele-btn-primary flex-1"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </>
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
              backgroundColor: toast.type === 'success' ? 'rgba(31,122,85,0.08)' : 'rgba(153,27,27,0.08)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(31,122,85,0.2)' : 'rgba(153,27,27,0.2)'}`,
              color: toast.type === 'success' ? '#1F7A55' : '#B3382B',
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
