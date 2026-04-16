'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload } from 'lucide-react'

interface Props {
  value: string
  onChange: (url: string) => void
  clientSlug: string
  tableName: string
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_BYTES = 5 * 1024 * 1024

export default function ImageUpload({ value, onChange, clientSlug, tableName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError('Error al subir la imagen. Máximo 5MB, formatos: JPG, PNG, WebP')
      return
    }

    setUploading(true)
    const filePath = `${clientSlug}/${tableName}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('client-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('Storage upload error:', JSON.stringify(uploadError))
      setError('Error al subir la imagen. Máximo 5MB, formatos: JPG, PNG, WebP')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('client-assets').getPublicUrl(filePath)
    onChange(data.publicUrl)
    setUploading(false)
  }

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1.5px dashed rgba(45,63,82,0.8)',
    backgroundColor: 'rgba(15,25,35,0.6)',
    color: '#8A9BAD',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
    width: '100%',
  } as const

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />

      {value ? (
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid rgba(45,63,82,0.4)' }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{ ...buttonStyle, width: 'auto', flexShrink: 0 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)'
              e.currentTarget.style.color = '#F5F2EE'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(45,63,82,0.8)'
              e.currentTarget.style.color = '#8A9BAD'
            }}
          >
            <Upload size={14} />
            {uploading ? 'Subiendo imagen…' : 'Cambiar imagen'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)'
            e.currentTarget.style.color = '#F5F2EE'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(45,63,82,0.8)'
            e.currentTarget.style.color = '#8A9BAD'
          }}
        >
          <Upload size={14} />
          {uploading ? 'Subiendo imagen…' : 'Subir imagen'}
        </button>
      )}

      {error && (
        <p className="text-xs mt-2" style={{ color: '#C43A2A' }}>{error}</p>
      )}
    </div>
  )
}
