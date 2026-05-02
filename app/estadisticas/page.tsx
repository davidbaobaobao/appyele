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
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
}

const DEVICE_ICONS: Record<string, string> = {
  mobile: '📱',
  desktop: '💻',
  tablet: '📟',
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Móvil',
  desktop: 'Escritorio',
  tablet: 'Tablet',
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

const S = {
  card: {
    backgroundColor: '#1E2B3A',
    border: '1px solid rgba(45,63,82,0.4)',
    borderRadius: '12px',
    padding: '20px',
  },
  label: {
    color: '#8A9BAD',
    fontSize: '11px',
    fontWeight: 600 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  sectionHeading: {
    color: '#F5F2EE',
    fontSize: '13px',
    fontWeight: 600 as const,
  },
  rowBase: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between' as const,
    padding: '8px 0',
  },
}

function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl"
      style={{ backgroundColor: '#1E2B3A', height }}
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
      .catch(() => {
        setError('Error cargando estadísticas')
        setLoading(false)
      })
  }, [period])

  const maxPageVisitors = data?.topPages[0]?.visitors ?? 1
  const maxCountryVisitors = data?.countries[0]?.visitors ?? 1

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0F1923' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col" style={{ marginLeft: '220px' }}>
        <TopBar title="Estadísticas" />

        <div className="flex-1 p-6 space-y-6" style={{ maxWidth: '900px' }}>

          {/* Heading */}
          <div>
            <h2
              className="text-2xl mb-1"
              style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}
            >
              Estadísticas de tu web
            </h2>
            <p className="text-sm" style={{ color: '#8A9BAD' }}>
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
                  className="rounded-lg px-4 py-2 text-sm transition-colors"
                  style={{
                    backgroundColor: active ? '#E8A020' : 'rgba(255,255,255,0.05)',
                    color: active ? '#0F1923' : '#8A9BAD',
                    border: active ? 'none' : '1px solid rgba(45,63,82,0.4)',
                    fontWeight: active ? 600 : 400,
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
                <SkeletonCard height={140} />
                <SkeletonCard height={140} />
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
            <div
              className="rounded-xl p-12 text-center"
              style={S.card}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(232,160,32,0.1)' }}
              >
                <BarChart2 size={22} style={{ color: '#E8A020' }} />
              </div>
              <p className="text-sm font-medium mb-2" style={{ color: '#F5F2EE' }}>
                Las estadísticas se activarán pronto
              </p>
              <p className="text-sm" style={{ color: '#8A9BAD' }}>
                Los datos de visitas aparecerán aquí una vez que tu web esté en marcha.
              </p>
            </div>
          )}

          {/* Generic error */}
          {!loading && error && error !== 'No project configured' && (
            <div
              className="rounded-xl p-6 text-center"
              style={{ ...S.card, borderColor: 'rgba(196,58,42,0.3)' }}
            >
              <p className="text-sm" style={{ color: '#C43A2A' }}>{error}</p>
            </div>
          )}

          {/* Data */}
          {!loading && data && (
            <div className="space-y-4">

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-4">
                <div style={S.card}>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} style={{ color: '#E8A020' }} />
                    <span style={S.label}>Visitantes únicos</span>
                  </div>
                  <div
                    style={{
                      color: '#F5F2EE',
                      fontSize: '44px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-dm-serif)',
                      lineHeight: 1.1,
                    }}
                  >
                    {data.visitors.toLocaleString('es-ES')}
                  </div>
                  <p className="mt-2 text-xs" style={{ color: '#8A9BAD' }}>
                    en los últimos {PERIOD_LABELS[period]}
                  </p>
                </div>

                <div style={S.card}>
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={14} style={{ color: '#E8A020' }} />
                    <span style={S.label}>Páginas vistas</span>
                  </div>
                  <div
                    style={{
                      color: '#F5F2EE',
                      fontSize: '44px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-dm-serif)',
                      lineHeight: 1.1,
                    }}
                  >
                    {data.pageviews.toLocaleString('es-ES')}
                  </div>
                  <p className="mt-2 text-xs" style={{ color: '#8A9BAD' }}>
                    en los últimos {PERIOD_LABELS[period]}
                  </p>
                </div>
              </div>

              {/* Top pages */}
              {data.topPages.length > 0 && (
                <div style={S.card}>
                  <div className="flex items-center gap-2 mb-4">
                    <Eye size={14} style={{ color: '#8A9BAD' }} />
                    <span style={S.sectionHeading}>Páginas más vistas</span>
                  </div>
                  <div>
                    {data.topPages.map((page, i) => (
                      <div
                        key={page.path}
                        style={{
                          ...S.rowBase,
                          borderBottom:
                            i < data.topPages.length - 1
                              ? '1px solid rgba(45,63,82,0.3)'
                              : 'none',
                        }}
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <span
                            className="text-sm block truncate"
                            style={{ color: '#F5F2EE' }}
                          >
                            {page.path || '/'}
                          </span>
                          <div
                            className="mt-1.5 h-1 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'rgba(45,63,82,0.5)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: '#E8A020',
                                width: `${Math.round((page.visitors / maxPageVisitors) * 100)}%`,
                                opacity: 0.65,
                              }}
                            />
                          </div>
                        </div>
                        <span
                          className="text-sm flex-shrink-0"
                          style={{ color: '#8A9BAD', minWidth: '48px', textAlign: 'right' }}
                        >
                          {page.visitors.toLocaleString('es-ES')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Devices + Countries side by side */}
              <div className="grid grid-cols-2 gap-4">

                {/* Devices */}
                {data.devices.length > 0 && (
                  <div style={S.card}>
                    <div className="flex items-center gap-2 mb-4">
                      <Monitor size={14} style={{ color: '#8A9BAD' }} />
                      <span style={S.sectionHeading}>Dispositivos</span>
                    </div>
                    <div className="space-y-4">
                      {data.devices.map(d => (
                        <div key={d.type}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm" style={{ color: '#F5F2EE' }}>
                              {DEVICE_ICONS[d.type] ?? '🖥'}{' '}
                              {DEVICE_LABELS[d.type] ?? d.type}
                            </span>
                            <span
                              className="text-sm font-medium"
                              style={{ color: '#8A9BAD' }}
                            >
                              {d.percentage}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'rgba(45,63,82,0.5)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: '#E8A020',
                                width: `${d.percentage}%`,
                                opacity: 0.65,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Countries */}
                {data.countries.length > 0 && (
                  <div style={S.card}>
                    <div className="flex items-center gap-2 mb-4">
                      <Globe size={14} style={{ color: '#8A9BAD' }} />
                      <span style={S.sectionHeading}>Países</span>
                    </div>
                    <div>
                      {data.countries.map((c, i) => (
                        <div
                          key={c.country}
                          style={{
                            ...S.rowBase,
                            borderBottom:
                              i < data.countries.length - 1
                                ? '1px solid rgba(45,63,82,0.3)'
                                : 'none',
                          }}
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <span className="text-sm" style={{ color: '#F5F2EE' }}>
                              {c.country}
                            </span>
                            <div
                              className="mt-1.5 h-1 rounded-full overflow-hidden"
                              style={{ backgroundColor: 'rgba(45,63,82,0.5)' }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: '#8A9BAD',
                                  width: `${Math.round((c.visitors / maxCountryVisitors) * 100)}%`,
                                  opacity: 0.5,
                                }}
                              />
                            </div>
                          </div>
                          <span
                            className="text-sm flex-shrink-0"
                            style={{ color: '#8A9BAD', minWidth: '48px', textAlign: 'right' }}
                          >
                            {c.visitors.toLocaleString('es-ES')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy note */}
              <p className="text-xs pb-2" style={{ color: '#8A9BAD' }}>
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
