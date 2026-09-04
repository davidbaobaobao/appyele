'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import StoreTabs from '@/components/StoreTabs'
import StoreProductManager from '@/components/StoreProductManager'

interface Store {
  id: string
  name: string
  currency: string
}

export default function StorePage() {
  const [store, setStore] = useState<Store | null>(null)
  const [clientSlug, setClientSlug] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, slug')
          .eq('user_id', user.id)
          .maybeSingle()

        if (clientError) console.error('store: client fetch error:', clientError)
        if (!client) return

        setClientSlug(client.slug ?? '')

        const { data: storeRow, error: storeError } = await supabase
          .from('stores')
          .select('id, name, currency')
          .eq('client_id', client.id)
          .maybeSingle()

        if (storeError) console.error('store: store fetch error:', storeError)
        if (storeRow) setStore(storeRow as Store)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: '#F2F0EB', border: '1px solid rgba(22,22,26,0.06)' }}
            >
              <p className="text-sm mb-1" style={{ fontFamily: 'var(--font-instrument)', color: '#16161A' }}>
                Your account does not have an online store yet.
              </p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                Get in touch with us if you want to add this feature.
              </p>
            </div>
          ) : (
            <StoreProductManager
              storeId={store.id}
              clientSlug={clientSlug}
              currency={store.currency}
            />
          )}
        </div>
      </main>
    </div>
  )
}
