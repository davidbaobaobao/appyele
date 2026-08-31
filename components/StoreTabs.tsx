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
              backgroundColor: isActive ? '#1D1D1F' : 'transparent',
              color: isActive ? '#FFFFFF' : '#86868B',
              border: `1px solid ${isActive ? '#1D1D1F' : 'rgba(0,0,0,0.12)'}`,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#F5F5F7'
                e.currentTarget.style.color = '#1D1D1F'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#86868B'
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
