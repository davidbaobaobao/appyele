'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, Link, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
}

const S = {
  input: {
    backgroundColor: '#152030',
    border: '1px solid rgba(45,63,82,0.6)',
    color: '#F5F2EE',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  } as const,
  label: {
    color: '#8A9BAD',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: '4px',
  },
  tab: (active: boolean) => ({
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: active ? '#E05A2B' : 'transparent',
    color: active ? '#fff' : '#8A9BAD',
  }),
  uploadZone: {
    border: '1.5px dashed rgba(45,63,82,0.8)',
    backgroundColor: 'rgba(15,25,35,0.6)',
    borderRadius: '8px',
    padding: '14px',
    textAlign: 'center' as const,
    cursor: 'pointer',
  },
}

const MAX_BYTES = 5 * 1024 * 1024

export default function ImageUploader({ value, onChange, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'url' | 'upload'>(value ? 'url' : 'url')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError('Máximo 5MB — JPG, PNG, WebP')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      onChange(data.publicUrl)
      setMode('url')
    } catch (err) {
      console.error('Upload error:', err)
      setError('Error al subir la imagen. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && <label style={S.label}>{label}</label>}

      {/* Mode toggle */}
      <div
        className="flex items-center gap-1 mb-2 p-1 rounded-lg"
        style={{ backgroundColor: '#1E2B3A', width: 'fit-content' }}
      >
        <button type="button" style={S.tab(mode === 'url')} onClick={() => setMode('url')}>
          <Link size={10} style={{ display: 'inline', marginRight: '4px' }} />
          URL
        </button>
        <button type="button" style={S.tab(mode === 'upload')} onClick={() => setMode('upload')}>
          <Upload size={10} style={{ display: 'inline', marginRight: '4px' }} />
          Subir
        </button>
      </div>

      {mode === 'url' && (
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://…"
          style={S.input}
        />
      )}

      {mode === 'upload' && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
          <div
            style={S.uploadZone}
            onClick={() => !uploading && inputRef.current?.click()}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(224,90,43,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(45,63,82,0.8)')}
          >
            <Upload size={16} style={{ color: '#8A9BAD', margin: '0 auto 6px' }} />
            <p className="text-xs" style={{ color: '#8A9BAD' }}>
              {uploading ? 'Subiendo…' : 'Haz clic para elegir imagen'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(138,155,173,0.5)' }}>JPG, PNG, WebP — máx. 5MB</p>
          </div>
        </>
      )}

      {error && <p className="text-xs mt-1" style={{ color: '#C43A2A' }}>{error}</p>}

      {value && (
        <div className="mt-2 relative" style={{ display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(45,63,82,0.4)', display: 'block' }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  )
}
