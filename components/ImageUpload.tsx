'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload } from 'lucide-react'

interface Props {
  value: string
  onChange: (url: string) => void
  clientSlug: string
  tableName: string
  useAdminApi?: boolean
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_BYTES = 5 * 1024 * 1024

export default function ImageUpload({ value, onChange, clientSlug, tableName, useAdminApi = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError('That file is over 5 MB. Use a JPG, PNG, WebP or GIF under 5 MB.')
      return
    }

    setUploading(true)
    const filePath = `${clientSlug}/${tableName}/${Date.now()}-${file.name}`

    if (useAdminApi) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('filePath', filePath)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? "Couldn't upload that image")
        setUploading(false)
        return
      }
      const { url } = await res.json()
      onChange(url)
    } else {
      const { error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Storage upload error:', JSON.stringify(uploadError))
        setError(uploadError.message)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('client-assets').getPublicUrl(filePath)
      onChange(data.publicUrl)
    }

    setUploading(false)
  }

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Image preview"
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '12px', flexShrink: 0, border: '1px solid rgba(22,22,26,0.12)' }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="yele-btn yele-btn-secondary flex-shrink-0"
          >
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Change image'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="yele-btn yele-btn-secondary w-full"
        >
          <Upload size={14} />
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
      )}

      {error && (
        <p className="text-xs mt-2" style={{ color: '#B3382B' }}>{error}</p>
      )}
    </div>
  )
}
