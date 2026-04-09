'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      console.error('signInWithOAuth threw:', err)
      setError('Error inesperado al iniciar sesión')
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0F1923' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: '#1E2B3A', border: '1px solid rgba(45,63,82,0.6)' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span
            className="text-3xl"
            style={{ fontFamily: 'var(--font-dm-serif)', color: '#E8A020' }}
          >
            Vitrina
            <span style={{ color: '#E8A020' }}>·</span>
          </span>
        </div>

        {!emailSent ? (
          <>
            <h1
              className="text-2xl font-semibold text-center mb-2"
              style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}
            >
              Accede a tu panel
            </h1>
            <p className="text-center text-sm mb-8" style={{ color: '#8A9BAD' }}>
              Gestiona tu web desde aquí
            </p>

            {error && (
              <div
                className="rounded-lg px-4 py-3 mb-4 text-sm"
                style={{ backgroundColor: 'rgba(196,58,42,0.15)', color: '#C43A2A', border: '1px solid rgba(196,58,42,0.3)' }}
              >
                {error}
              </div>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-lg py-3 px-4 font-semibold text-sm transition-colors mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#E8A020', color: '#0F1923' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#B87A10' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#E8A020' }}
            >
              <GoogleIcon />
              Continuar con Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(45,63,82,0.6)' }} />
              <span className="text-xs" style={{ color: '#8A9BAD' }}>o</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(45,63,82,0.6)' }} />
            </div>

            {/* Email button / form */}
            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-3 px-4 font-medium text-sm transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
              >
                Acceder con email
              </button>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full rounded-lg py-3 px-4 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: '#0F1923',
                    border: '1px solid rgba(45,63,82,0.6)',
                    color: '#F5F2EE',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(232,160,32,0.6)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(45,63,82,0.6)' }}
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-lg py-3 px-4 font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#E8A020', color: '#0F1923' }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#B87A10' }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#E8A020' }}
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
                </button>
              </form>
            )}
          </>
        ) : (
          /* Email sent confirmation */
          <div className="text-center py-4">
            <div className="text-4xl mb-4">📬</div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: 'var(--font-dm-serif)', color: '#F5F2EE' }}
            >
              Revisa tu bandeja de entrada
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8A9BAD' }}>
              Hemos enviado un enlace de acceso a{' '}
              <span style={{ color: '#F5F2EE' }}>{email}</span>
            </p>
            <button
              onClick={() => { setEmailSent(false); setShowEmailForm(false); setEmail('') }}
              className="text-sm transition-colors"
              style={{ color: '#8A9BAD' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F5F2EE' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8A9BAD' }}
            >
              ← Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
