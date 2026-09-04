'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Receipt } from 'lucide-react'

const TABS = [
  { label: 'Products', href: '/store', icon: Package },
  { label: 'Orders', href: '/store/orders', icon: Receipt },
]

export default function StoreTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors"
            style={{
              fontFamily: 'var(--font-instrument)',
              fontWeight: isActive ? 600 : 400,
              backgroundColor: isActive ? '#16161A' : 'transparent',
              color: isActive ? '#FFFFFF' : '#8A8A92',
              border: `1px solid ${isActive ? '#16161A' : 'rgba(22,22,26,0.12)'}`,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#F2F0EB'
                e.currentTarget.style.color = '#16161A'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#8A8A92'
              }
            }}
          >
            <Icon size={13} strokeWidth={1.75} />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
