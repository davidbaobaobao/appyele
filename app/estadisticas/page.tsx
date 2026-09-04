'use client'

import { useState, useEffect } from 'react'
import { Users, Eye, Monitor, Globe, BarChart2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

const PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const PERIOD_LABELS: Record<string, string> = {
  '7d': '7 days', '30d': '30 days', '90d': '90 days',
}

const DEVICE_ICONS: Record<string, string> = {
  mobile: '📱', desktop: '💻', tablet: '📟',
}
const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Mobile', desktop: 'Desktop', tablet: 'Tablet',
}

/* Chart palette: orchid = primary series, ink = secondary, mist at low alpha
   for tracks, gridlines and row rules. */
const SERIES_PRIMARY = '#D46FC8'
const SERIES_SECONDARY = '#16161A'
const GRID = 'rgba(138,138,146,0.18)'
const GRID_SOFT = 'rgba(138,138,146,0.12)'

interface StatsData {
  pageviews: number
  visitors: number
  topPages: Array<{ path: string; visitors: number }>
  devices: Array<{ type: string; percentage: number }>
  countries: Array<{ country: string; visitors: number }>
  period: string
  businessName: string
}

function SkeletonCard({ height = 130 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-2xl"
      style={{ backgroundColor: '#EEEDE9', height }}
    />
  )
}

export default function EstadisticasPage() {
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setData(null)
    fetch(`/api/stats?period=${period}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError("Couldn't load analytics"); setLoading(false) })
  }, [period])

  const maxPageVisitors    = data?.topPages[0]?.visitors ?? 1
  const maxCountryVisitors = data?.countries[0]?.visitors ?? 1

  const statNumber: React.CSSProperties = {
    color: '#16161A', fontSize: '44px', fontWeight: 700,
    fontFamily: 'var(--font-display)', lineHeight: 1.1,
    letterSpacing: '-0.02em',
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F7F6F3' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main">
        <TopBar title="Analytics" />

        <div className="flex-1 p-6 space-y-6" style={{ maxWidth: '900px' }}>

          {/* Heading */}
          <div>
            <span className="yele-eyebrow block mb-3">Analytics</span>
            <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
              Your website analytics
            </h2>
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
              Visits and how people move through your site
            </p>
          </div>

          {/* Period selector */}
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p => {
              const active = period === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value)}
                  aria-pressed={active}
                  className={`yele-btn ${active ? 'yele-btn-primary' : 'yele-btn-secondary'}`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SkeletonCard height={150} />
                <SkeletonCard height={150} />
              </div>
              <SkeletonCard height={180} />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonCard height={160} />
                <SkeletonCard height={160} />
              </div>
            </div>
          )}

          {/* No project configured */}
          {!loading && error === 'No project configured' && (
            <div className="yele-card yele-card-lg p-12 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(212,111,200,0.12)' }}
              >
                <BarChart2 size={22} style={{ color: '#D46FC8' }} />
              </div>
              <p className="text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-display)', color: '#16161A' }}>
                Analytics turn on soon
              </p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                Visit data will show up here once your site is live.
              </p>
            </div>
          )}

          {/* Generic error */}
          {!loading && error && error !== 'No project configured' && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                backgroundColor: 'rgba(179,56,43,0.09)',
                boxShadow: '0 0 0 1px rgba(179,56,43,0.20)',
              }}
            >
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#B3382B' }}>{error}</p>
            </div>
          )}

          {/* Data */}
          {!loading && data && (
            <div className="space-y-4">

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="yele-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} style={{ color: SERIES_PRIMARY }} />
                    <span className="yele-eyebrow">Unique visitors</span>
                  </div>
                  <div style={statNumber}>
                    {data.visitors.toLocaleString('en-US')}
                  </div>
                  <p className="mt-2 text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                    in the last {PERIOD_LABELS[period]}
                  </p>
                </div>

                <div className="yele-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={14} style={{ color: SERIES_PRIMARY }} />
                    <span className="yele-eyebrow">Page views</span>
                  </div>
                  <div style={statNumber}>
                    {data.pageviews.toLocaleString('en-US')}
                  </div>
                  <p className="mt-2 text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                    in the last {PERIOD_LABELS[period]}
                  </p>
                </div>
              </div>

              {/* Top pages */}
              {data.topPages.length > 0 && (
                <div className="yele-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye size={14} style={{ color: '#8A8A92' }} />
                    <span className="yele-eyebrow">Top pages</span>
                  </div>
                  {data.topPages.map((page, i) => (
                    <div
                      key={page.path}
                      className="flex items-center py-2"
                      style={{ borderBottom: i < data.topPages.length - 1 ? `1px solid ${GRID_SOFT}` : 'none' }}
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <span className="text-sm block truncate" style={{ fontFamily: 'var(--font-instrument)', color: '#16161A' }}>
                          {page.path || '/'}
                        </span>
                        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: GRID }}>
                          <div
                            className="h-full rounded-full"
                            style={{ backgroundColor: SERIES_PRIMARY, width: `${Math.round((page.visitors / maxPageVisitors) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', color: '#8A8A92', minWidth: '48px', textAlign: 'right' }}>
                        {page.visitors.toLocaleString('en-US')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Devices + Countries */}
              <div className="grid grid-cols-2 gap-4">
                {data.devices.length > 0 && (
                  <div className="yele-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Monitor size={14} style={{ color: '#8A8A92' }} />
                      <span className="yele-eyebrow">Devices</span>
                    </div>
                    <div className="space-y-4">
                      {data.devices.map(d => (
                        <div key={d.type}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#16161A' }}>
                              {DEVICE_ICONS[d.type] ?? '🖥'} {DEVICE_LABELS[d.type] ?? d.type}
                            </span>
                            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-mono)', color: '#8A8A92' }}>
                              {d.percentage}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: GRID }}>
                            <div className="h-full rounded-full" style={{ backgroundColor: SERIES_PRIMARY, width: `${d.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.countries.length > 0 && (
                  <div className="yele-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe size={14} style={{ color: '#8A8A92' }} />
                      <span className="yele-eyebrow">Countries</span>
                    </div>
                    {data.countries.map((c, i) => (
                      <div
                        key={c.country}
                        className="flex items-center py-2"
                        style={{ borderBottom: i < data.countries.length - 1 ? `1px solid ${GRID_SOFT}` : 'none' }}
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <span className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#16161A' }}>{c.country}</span>
                          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: GRID }}>
                            <div
                              className="h-full rounded-full"
                              style={{ backgroundColor: SERIES_SECONDARY, width: `${Math.round((c.visitors / maxCountryVisitors) * 100)}%`, opacity: 0.65 }}
                            />
                          </div>
                        </div>
                        <span className="text-sm flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', color: '#8A8A92', minWidth: '48px', textAlign: 'right' }}>
                          {c.visitors.toLocaleString('en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy note */}
              <p className="text-xs pb-2" style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}>
                Data refreshes every 24 hours.
                Privacy-friendly analytics — no tracking cookies.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
