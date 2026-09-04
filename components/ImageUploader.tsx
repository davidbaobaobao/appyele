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
  tab: (active: boolean) => ({
    padding: '5px 12px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: '9999px',
    border: 'none',
    backgroundColor: active ? '#16161A' : 'transparent',
    color: active ? '#FFFFFF' : '#8A8A92',
  }),
  uploadZone: {
    border: '1.5px dashed rgba(22,22,26,0.16)',
    backgroundColor: '#F2F0EB',
    borderRadius: '12px',
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
      setError('Max 5 MB — JPG, PNG or WebP')
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
      setError("Couldn't upload that image. Try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && <label className="yele-eyebrow block mb-1.5">{label}</label>}

      {/* Mode toggle */}
      <div
        className="flex items-center gap-1 mb-2 p-1 rounded-lg"
        style={{ backgroundColor: '#F2F0EB', width: 'fit-content' }}
      >
        <button type="button" style={S.tab(mode === 'url')} onClick={() => setMode('url')}>
          <Link size={10} style={{ display: 'inline', marginRight: '4px' }} />
          URL
        </button>
        <button type="button" style={S.tab(mode === 'upload')} onClick={() => setMode('upload')}>
          <Upload size={10} style={{ display: 'inline', marginRight: '4px' }} />
          Upload
        </button>
      </div>

      {mode === 'url' && (
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://…"
          className="yele-input"
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
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,111,200,0.55)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(22,22,26,0.16)')}
          >
            <Upload size={16} style={{ color: '#8A8A92', margin: '0 auto 6px' }} />
            <p className="text-xs" style={{ color: '#8A8A92' }}>
              {uploading ? 'Uploading…' : 'Click to choose an image'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(138,138,146,0.8)' }}>JPG, PNG or WebP — 5 MB max</p>
          </div>
        </>
      )}

      {error && <p className="text-xs mt-1" style={{ color: '#B3382B' }}>{error}</p>}

      {value && (
        <div className="mt-2 relative" style={{ display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Image preview"
            style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(22,22,26,0.12)', display: 'block' }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove image"
            title="Remove image"
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
              color: '#FFFFFF',
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  )
}
