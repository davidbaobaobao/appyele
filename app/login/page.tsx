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

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.08)',
    color: '#1D1D1F',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    fontFamily: 'var(--font-instrument)',
    transition: 'all 0.15s',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#F5F5F7' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-10"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}
          >
            Yele
          </div>
        </div>

        {!emailSent ? (
          <>
            <h1
              className="text-xl font-semibold text-center mb-1"
              style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}
            >
              Accede a tu panel
            </h1>
            <p
              className="text-center text-sm mb-8"
              style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
            >
              Gestiona tu web desde aquí
            </p>

            {error && (
              <div
                className="rounded-xl px-4 py-3 mb-4 text-sm"
                style={{
                  backgroundColor: 'rgba(153,27,27,0.06)',
                  color: '#991b1b',
                  border: '1px solid rgba(153,27,27,0.15)',
                  fontFamily: 'var(--font-instrument)',
                }}
              >
                {error}
              </div>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 text-sm transition-colors mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
                color: '#1D1D1F',
                fontFamily: 'var(--font-instrument)',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#F5F5F7' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#FFFFFF' }}
            >
              <GoogleIcon />
              Continuar con Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
              <span className="text-xs" style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}>o</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
            </div>

            {/* Email button / form */}
            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(0,0,0,0.12)',
                  color: '#1D1D1F',
                  fontFamily: 'var(--font-instrument)',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
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
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-xl py-3 px-4 text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#1D1D1F',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-instrument)',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">📬</div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: 'var(--font-outfit)', color: '#1D1D1F' }}
            >
              Revisa tu bandeja
            </h2>
            <p
              className="text-sm mb-6"
              style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
            >
              Hemos enviado un enlace de acceso a{' '}
              <span style={{ color: '#1D1D1F' }}>{email}</span>
            </p>
            <button
              onClick={() => { setEmailSent(false); setShowEmailForm(false); setEmail('') }}
              className="text-sm transition-colors"
              style={{ fontFamily: 'var(--font-instrument)', color: '#86868B' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1D1D1F' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#86868B' }}
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
