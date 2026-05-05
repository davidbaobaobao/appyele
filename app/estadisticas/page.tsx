'use client'

import { useState, useEffect } from 'react'
import { Users, Eye, Monitor, Globe, BarChart2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

const PERIODS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
]

const PERIOD_LABELS: Record<string, string> = {
  '7d': '7 días', '30d': '30 días', '90d': '90 días',
}

const DEVICE_ICONS: Record<string, string> = {
  mobile: '📱', desktop: '💻', tablet: '📟',
}
const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Móvil', desktop: 'Escritorio', tablet: 'Tablet',
}

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
      style={{ backgroundColor: '#F5F5F7', height }}
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
      .catch(() => { setError('Error cargando estadísticas'); setLoading(false) })
  }, [period])

  const maxPageVisitors    = data?.topPages[0]?.visitors ?? 1
  const maxCountryVisitors = data?.countries[0]?.visitors ?? 1

  const card: React.CSSProperties = {
    backgroundColor: '#F5F5F7',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: '16px',
    padding: '20px',
  }

  const label: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: '#86868B', fontFamily: 'var(--font-instrument)',
  }

  const sectionHead: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600, color: '#1D1D1F', fontFamily: 'var(--font-outfit)',
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col dashboard-main">
        <TopBar title="Estadísticas" />

        <div className="flex-1 p-6 space-y-6" style={{ maxWidth: '900px' }}>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
              Estadísticas de tu web
            </h2>
            <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
              Visitas y comportamiento de tus visitantes
            </p>
          </div>

          {/* Period selector */}
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p => {
              const active = period === p.value
              return (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className="rounded-xl px-4 py-2 text-sm transition-colors"
                  style={{
                    backgroundColor: active ? '#1D1D1F' : 'transparent',
                    color: active ? '#FFFFFF' : '#86868B',
                    border: active ? 'none' : '1px solid rgba(0,0,0,0.08)',
                    fontWeight: active ? 500 : 400,
                    fontFamily: 'var(--font-instrument)',
                    cursor: 'pointer',
                  }}
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
            <div className="rounded-2xl p-12 text-center" style={card}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(200,169,126,0.12)' }}
              >
                <BarChart2 size={22} style={{ color: '#C8A97E' }} />
              </div>
              <p className="text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}>
                Las estadísticas se activarán pronto
              </p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                Los datos de visitas aparecerán aquí una vez que tu web esté en marcha.
              </p>
            </div>
          )}

          {/* Generic error */}
          {!loading && error && error !== 'No project configured' && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ ...card, border: '1px solid rgba(153,27,27,0.15)', backgroundColor: 'rgba(153,27,27,0.04)' }}
            >
              <p className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#991b1b' }}>{error}</p>
            </div>
          )}

          {/* Data */}
          {!loading && data && (
            <div className="space-y-4">

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-4">
                <div style={card}>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} style={{ color: '#C8A97E' }} />
                    <span style={label}>Visitantes únicos</span>
                  </div>
                  <div
                    style={{
                      color: '#1D1D1F', fontSize: '44px', fontWeight: 700,
                      fontFamily: 'var(--font-outfit)', lineHeight: 1.1,
                    }}
                  >
                    {data.visitors.toLocaleString('es-ES')}
                  </div>
                  <p className="mt-2 text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                    en los últimos {PERIOD_LABELS[period]}
                  </p>
                </div>

                <div style={card}>
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={14} style={{ color: '#C8A97E' }} />
                    <span style={label}>Páginas vistas</span>
                  </div>
                  <div
                    style={{
                      color: '#1D1D1F', fontSize: '44px', fontWeight: 700,
                      fontFamily: 'var(--font-outfit)', lineHeight: 1.1,
                    }}
                  >
                    {data.pageviews.toLocaleString('es-ES')}
                  </div>
                  <p className="mt-2 text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                    en los últimos {PERIOD_LABELS[period]}
                  </p>
                </div>
              </div>

              {/* Top pages */}
              {data.topPages.length > 0 && (
                <div style={card}>
                  <div className="flex items-center gap-2 mb-4">
                    <Eye size={14} style={{ color: '#86868B' }} />
                    <span style={sectionHead}>Páginas más vistas</span>
                  </div>
                  {data.topPages.map((page, i) => (
                    <div
                      key={page.path}
                      className="flex items-center py-2"
                      style={{ borderBottom: i < data.topPages.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <span className="text-sm block truncate" style={{ fontFamily: 'var(--font-instrument)', color: '#1D1D1F' }}>
                          {page.path || '/'}
                        </span>
                        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ backgroundColor: '#C8A97E', width: `${Math.round((page.visitors / maxPageVisitors) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm flex-shrink-0" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B', minWidth: '48px', textAlign: 'right' }}>
                        {page.visitors.toLocaleString('es-ES')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Devices + Countries */}
              <div className="grid grid-cols-2 gap-4">
                {data.devices.length > 0 && (
                  <div style={card}>
                    <div className="flex items-center gap-2 mb-4">
                      <Monitor size={14} style={{ color: '#86868B' }} />
                      <span style={sectionHead}>Dispositivos</span>
                    </div>
                    <div className="space-y-4">
                      {data.devices.map(d => (
                        <div key={d.type}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#1D1D1F' }}>
                              {DEVICE_ICONS[d.type] ?? '🖥'} {DEVICE_LABELS[d.type] ?? d.type}
                            </span>
                            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                              {d.percentage}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                            <div className="h-full rounded-full" style={{ backgroundColor: '#C8A97E', width: `${d.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.countries.length > 0 && (
                  <div style={card}>
                    <div className="flex items-center gap-2 mb-4">
                      <Globe size={14} style={{ color: '#86868B' }} />
                      <span style={sectionHead}>Países</span>
                    </div>
                    {data.countries.map((c, i) => (
                      <div
                        key={c.country}
                        className="flex items-center py-2"
                        style={{ borderBottom: i < data.countries.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <span className="text-sm" style={{ fontFamily: 'var(--font-instrument)', color: '#1D1D1F' }}>{c.country}</span>
                          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ backgroundColor: '#86868B', width: `${Math.round((c.visitors / maxCountryVisitors) * 100)}%`, opacity: 0.5 }}
                            />
                          </div>
                        </div>
                        <span className="text-sm flex-shrink-0" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B', minWidth: '48px', textAlign: 'right' }}>
                          {c.visitors.toLocaleString('es-ES')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy note */}
              <p className="text-xs pb-2" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>
                Los datos se actualizan cada 24 horas.
                Analítica respetuosa con la privacidad — sin cookies de seguimiento.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
