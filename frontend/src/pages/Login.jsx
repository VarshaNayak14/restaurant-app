import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import logo from '/logo.png'
import './Auth.css'

const TAGS = [
  { label: 'Biryani Royale',   left: '8%',  dur: '14s', delay: '0s',  r: '-6deg' },
  { label: 'Tandoori Special', left: '72%', dur: '18s', delay: '3s',  r: '5deg'  },
  { label: 'Fresh & Healthy',  left: '25%', dur: '16s', delay: '6s',  r: '-3deg' },
  { label: 'Gulab Jamun',      left: '40%', dur: '13s', delay: '9s',  r: '-9deg' },
  { label: 'Mango Lassi',      left: '82%', dur: '17s', delay: '4s',  r: '4deg'  },
]

/* ─── FORGOT PASSWORD sub-form ─── */
function ForgotForm({ onBack }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [err,     setErr]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) setSent(true)
      else setErr(data.error || 'Something went wrong.')
    } catch {
      setErr('Network error. Please try again.')
    }
    setLoading(false)
  }

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(5,150,105,.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <CheckCircle size={32} color="#059669" />
      </div>
      <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.1rem' }}>Check your inbox!</h3>
      <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,.65)', fontSize: '.87rem', lineHeight: 1.6 }}>
        If <strong style={{ color: '#C9952A' }}>{email}</strong> is registered, a reset link has been sent.
        Check spam/junk folder too. Link expires in 15 minutes.
      </p>
      <button className="btn-primary auth-submit" onClick={onBack}>Back to Login</button>
    </div>
  )

  return (
    <>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: 'rgba(255,255,255,.6)',
          fontSize: '.84rem', cursor: 'pointer', padding: '0 0 16px',
        }}
      >
        <ArrowLeft size={15} /> Back to login
      </button>

      <div className="auth-heading">
        <h1>Forgot Password?</h1>
        <div className="auth-divider" />
        <p style={{ marginTop: 10 }}>
          Enter your email and we'll send a reset link.
        </p>
      </div>

      {err && <div className="auth-error">{err}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Email Address</label>
          <div className="input-wrap">
            <Mail size={16} className="input-icon" />
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required autoFocus autoComplete="email"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Send Reset Link'}
        </button>
      </form>
    </>
  )
}

/* ─── MAIN LOGIN PAGE ─── */
export default function Login() {
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')
  const [showP,    setShowP]    = useState(false)
  const [err,      setErr]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const { login }  = useAuth()
  const navigate   = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    const res = await login(email, pass)
    setLoading(false)
    if (res.success) navigate(res.role === 'admin' ? '/admin' : '/')
    else setErr(res.error)
  }

  return (
    <div className="auth-page">

      {/* Background */}
      <div className="auth-bg">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=1000&fit=crop&q=90"
          alt="" aria-hidden="true"
        />
        <div className="auth-bg-overlay" />
        <div className="auth-bg-grain" />
      </div>

      {/* Floating tags */}
      <div className="auth-tags" aria-hidden="true">
        {TAGS.map(t => (
          <span key={t.label} className="auth-tag" style={{
            left: t.left, bottom: '-60px',
            animationDuration: t.dur, animationDelay: t.delay, '--r': t.r,
          }}>{t.label}</span>
        ))}
      </div>

      {/* Glass card */}
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo-block">
          <img src={logo} alt="HungryHub" />
          <span>Hungry<b>Hub</b></span>
        </div>

        {showForgot ? (
          <ForgotForm onBack={() => setShowForgot(false)} />
        ) : (
          <>
            <div className="auth-heading">
              <h1>Welcome back</h1>
              <div className="auth-divider" />
              <p style={{ marginTop: 12 }}>
                Don't have an account?&nbsp;
                <Link to="/register">Register free</Link>
              </p>
            </div>

            {err && <div className="auth-error">{err}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <div className="input-wrap">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#C9952A', fontSize: '.78rem', fontWeight: 600,
                      padding: 0, textDecoration: 'underline',
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showP ? 'text' : 'password'} value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowP(p => !p)}>
                    {showP ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}