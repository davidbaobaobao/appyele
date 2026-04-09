'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UtensilsCrossed, Briefcase, Users, Quote, HelpCircle, Tag, Home, Image } from 'lucide-react'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import CardManager, { FieldDef } from '@/components/CardManager'

const SECTION_CONFIG: Record<string, { title: string; icon: React.ReactNode; fields: FieldDef[] }> = {
  catalog_items: {
    title: 'Carta / Catálogo',
    icon: <UtensilsCrossed size={14} />,
    fields: [
      { key: 'name',        label: 'Nombre',      type: 'text',     required: true, placeholder: 'Ej. Paella valenciana' },
      { key: 'category',   label: 'Categoría',   type: 'text',     placeholder: 'Ej. Arroces' },
      { key: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Describe el producto…' },
      { key: 'price',       label: 'Precio',      type: 'text',     placeholder: 'Ej. 14,50 €' },
      { key: 'available',   label: 'Disponible',  type: 'toggle' },
    ],
  },
  services: {
    title: 'Servicios',
    icon: <Briefcase size={14} />,
    fields: [
      { key: 'name',        label: 'Nombre del servicio', type: 'text',     required: true },
      { key: 'description', label: 'Descripción',         type: 'textarea' },
      { key: 'price',       label: 'Precio',              type: 'text',     placeholder: 'Ej. Desde 50 €' },
      { key: 'price_label', label: 'Etiqueta de precio',  type: 'text',     placeholder: 'Ej. Consultar' },
    ],
  },
  team_members: {
    title: 'Equipo',
    icon: <Users size={14} />,
    fields: [
      { key: 'name',      label: 'Nombre',    type: 'text', required: true },
      { key: 'role',      label: 'Cargo',     type: 'text' },
      { key: 'photo_url', label: 'URL foto',  type: 'url' },
    ],
  },
  testimonials: {
    title: 'Testimonios',
    icon: <Quote size={14} />,
    fields: [
      { key: 'author_name', label: 'Nombre del autor', type: 'text',     required: true },
      { key: 'author_role', label: 'Cargo del autor',  type: 'text' },
      { key: 'body',        label: 'Testimonio',        type: 'textarea', required: true },
      { key: 'rating',      label: 'Valoración (1–5)', type: 'number',   placeholder: '5' },
    ],
  },
  faqs: {
    title: 'Preguntas frecuentes',
    icon: <HelpCircle size={14} />,
    fields: [
      { key: 'question', label: 'Pregunta',  type: 'text',     required: true },
      { key: 'answer',   label: 'Respuesta', type: 'textarea', required: true },
    ],
  },
  offers: {
    title: 'Ofertas',
    icon: <Tag size={14} />,
    fields: [
      { key: 'title',       label: 'Título',            type: 'text',     required: true },
      { key: 'badge',       label: 'Etiqueta (badge)',  type: 'text',     placeholder: 'Ej. -20%' },
      { key: 'description', label: 'Descripción',       type: 'textarea' },
      { key: 'valid_until', label: 'Válido hasta',      type: 'date' },
    ],
  },
  listings: {
    title: 'Inmuebles',
    icon: <Home size={14} />,
    fields: [
      { key: 'title',    label: 'Título',          type: 'text',   required: true },
      { key: 'type',     label: 'Tipo',            type: 'select', options: ['Venta', 'Alquiler'] },
      { key: 'price',    label: 'Precio',          type: 'text' },
      { key: 'size_m2',  label: 'Superficie (m²)', type: 'number' },
      { key: 'rooms',    label: 'Habitaciones',    type: 'number' },
      { key: 'location', label: 'Ubicación',       type: 'text' },
    ],
  },
  gallery: {
    title: 'Galería',
    icon: <Image size={14} />,
    fields: [
      { key: 'image_url', label: 'URL de imagen', type: 'url',  required: true },
      { key: 'caption',   label: 'Descripción',   type: 'text' },
      { key: 'category',  label: 'Categoría',     type: 'text' },
    ],
  },
}

export default function ContenidoPage() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [dynamicSections, setDynamicSections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client, error } = await supabase
        .from('clients')
        .select('id, dynamic_sections')
        .eq('user_id', user.id)
        .single()

      if (error) console.error('contenido fetch error:', error)

      if (client) {
        setClientId(client.id)
        setDynamicSections(client.dynamic_sections ?? [])
      }
      setLoading(false)
    }
    loadClient()
  }, [])

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0F1923' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col" style={{ marginLeft: '220px' }}>
        <TopBar title="Contenido" />

        <div className="flex-1 p-6 max-w-5xl space-y-8">
          <div>
            <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}>
              Contenido
            </h2>
            <p className="text-sm" style={{ color: '#8A9BAD' }}>
              Gestiona el contenido dinámico de tu web
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl h-40" style={{ backgroundColor: '#1E2B3A' }} />
              ))}
            </div>
          ) : !clientId ? null : dynamicSections.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.4)' }}
            >
              <p className="text-sm mb-1" style={{ color: '#F5F2EE' }}>
                No tienes secciones dinámicas configuradas.
              </p>
              <p className="text-sm" style={{ color: '#8A9BAD' }}>
                Escríbenos si quieres añadir esta funcionalidad.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {dynamicSections.map((sectionKey) => {
                const config = SECTION_CONFIG[sectionKey]
                if (!config) return null
                return (
                  <CardManager
                    key={sectionKey}
                    sectionKey={sectionKey}
                    clientId={clientId}
                    title={config.title}
                    icon={config.icon}
                    fields={config.fields}
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
