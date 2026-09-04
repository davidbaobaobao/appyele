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

      const fullName = user.user_metadata?.full_name || user.user_metadata?.name
      if (fullName) {
        const parts = fullName.trim().split(' ')
        setFirstName(parts[0])
        setInitials(parts.map((p: string) => p[0]).slice(0, 2).join('').toUpperCase())
        return
      }

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
      className="flex items-center justify-between px-6 h-16 flex-shrink-0"
      style={{
        borderBottom: '1px solid rgba(22,22,26,0.08)',
        backgroundColor: 'rgba(247,246,243,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Page title */}
      <h1
        className="text-base font-semibold pl-10 lg:pl-0"
        style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}
      >
        {title}
      </h1>

      {/* User greeting + avatar */}
      <div className="flex items-center gap-3">
        {firstName && (
          <span className="text-sm hidden sm:block" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
            Hi, <span style={{ color: '#16161A' }}>{firstName}</span>
          </span>
        )}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
          style={{
            backgroundColor: 'rgba(212,111,200,0.15)',
            color: '#D46FC8',
            border: '1px solid rgba(212,111,200,0.3)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
