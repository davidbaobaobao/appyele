'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TopBarProps {
  title: string
}

export default function TopBar({ title }: TopBarProps) {
  const [firstName, setFirstName] = useState<string | null>(null)
  const [initials, setInitials] = useState<string>('?')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Try to get name from user metadata (Google auth)
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name
      if (fullName) {
        const parts = fullName.trim().split(' ')
        setFirstName(parts[0])
        setInitials(parts.map((p: string) => p[0]).slice(0, 2).join('').toUpperCase())
        return
      }

      // Fallback: get business name from clients table
      const { data: client } = await supabase
        .from('clients')
        .select('business_name')
        .eq('user_id', user.id)
        .single()

      if (client?.business_name) {
        const words = client.business_name.trim().split(' ')
        setFirstName(words[0])
        setInitials(words.map((w: string) => w[0]).slice(0, 2).join('').toUpperCase())
      } else if (user.email) {
        const emailName = user.email.split('@')[0]
        setFirstName(emailName)
        setInitials(emailName.slice(0, 2).toUpperCase())
      }
    }

    loadUser()
  }, [])

  return (
    <header
      className="flex items-center justify-between px-6 h-14 flex-shrink-0"
      style={{
        borderBottom: '1px solid rgba(45,63,82,0.3)',
        backgroundColor: '#0F1923',
      }}
    >
      {/* Page title */}
      <h1
        className="text-base font-semibold"
        style={{ color: '#F5F2EE' }}
      >
        {title}
      </h1>

      {/* User greeting + avatar */}
      <div className="flex items-center gap-3">
        {firstName && (
          <span className="text-sm" style={{ color: '#8A9BAD' }}>
            Hola, <span style={{ color: '#F5F2EE' }}>{firstName}</span>
          </span>
        )}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
          style={{ backgroundColor: 'rgba(232,160,32,0.15)', color: '#E8A020', border: '1px solid rgba(232,160,32,0.3)' }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
