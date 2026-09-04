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
      setError('Something went wrong signing you in')
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

  const bigButton: React.CSSProperties = {
    width: '100%',
    padding: '13px 20px',
    fontSize: '14px',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#F7F6F3' }}
    >
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#16161A' }}
            aria-hidden
          >
            <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D46FC8' }} />
          </span>
          <span
            className="text-2xl font-semibold leading-none"
            style={{ fontFamily: 'var(--font-display)', color: '#16161A', letterSpacing: '-0.02em' }}
          >
            yele
          </span>
        </div>

        <div className="yele-card yele-card-lg p-10">
          {!emailSent ? (
            <>
              <p className="yele-eyebrow text-center mb-3">Client portal</p>
              <h1
                className="text-2xl font-semibold text-center mb-2"
                style={{ fontFamily: 'var(--font-display)', color: '#16161A', letterSpacing: '-0.02em' }}
              >
                Sign in
              </h1>
              <p
                className="text-center text-sm mb-8"
                style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}
              >
                Manage your website from one place.
              </p>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 mb-4 text-sm"
                  style={{
                    backgroundColor: 'rgba(179,56,43,0.09)',
                    color: '#B3382B',
                    border: '1px solid rgba(179,56,43,0.18)',
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
                className="yele-btn yele-btn-secondary mb-3"
                style={bigButton}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 yele-rule" />
                <span className="yele-eyebrow" style={{ fontSize: '11px' }}>or</span>
                <div className="flex-1 yele-rule" />
              </div>

              {/* Email button / form */}
              {!showEmailForm ? (
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="yele-btn yele-btn-ghost"
                  style={bigButton}
                >
                  Continue with email
                </button>
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div>
                    <label htmlFor="login-email" className="yele-label">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className="yele-input"
                      style={{ padding: '12px 16px' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="yele-btn yele-btn-primary"
                    style={bigButton}
                  >
                    {loading ? 'Sending…' : 'Send sign-in link'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <p className="yele-eyebrow mb-3">Check your inbox</p>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: '#16161A', letterSpacing: '-0.02em' }}
              >
                Your link is on its way
              </h2>
              <p
                className="text-sm mb-6"
                style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}
              >
                We sent a sign-in link to{' '}
                <span style={{ color: '#16161A' }}>{email}</span>
              </p>
              <button
                onClick={() => { setEmailSent(false); setShowEmailForm(false); setEmail('') }}
                className="yele-btn yele-btn-ghost"
              >
                ← Back
              </button>
            </div>
          )}
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ fontFamily: 'var(--font-instrument)', color: '#8A8A92' }}
        >
          Need a hand?{' '}
          <a href="mailto:info@yele.design" style={{ color: '#16161A', textDecoration: 'underline' }}>
            info@yele.design
          </a>
        </p>
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
