import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { API_BASE } from '../data/dishes.js'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '/logo.png'
import './Auth.css'

const TAGS = [
  { label: 'Biryani Royale',   left: '8%',  dur: '14s', delay: '0s',  r: '-6deg' },
  { label: 'Tandoori Special', left: '72%', dur: '18s', delay: '3s',  r: '5deg'  },
  { label: 'Fresh & Healthy',  left: '25%', dur: '16s', delay: '6s',  r: '-3deg' },
  { label: 'Gulab Jamun',      left: '40%', dur: '13s', delay: '9s',  r: '-9deg' },
  { label: 'Mango Lassi',      left: '82%', dur: '17s', delay: '4s',  r: '4deg'  },
]

export default function ResetPassword() {
  const { token }   = useParams()
  const navigate    = useNavigate()
  const { setUserFromToken } = useAuth()

  const [pass,    setPass]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [showP,   setShowP]   = useState(false)
  const [showC,   setShowC]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const [success, setSuccess] = useState(false)

  const strength = pass.length === 0 ? 0
    : pass.length < 6 ? 1
    : pass.length < 10 ? 2
    : /[A-Z]/.test(pass) && /[0-9]/.test(pass) ? 4 : 3

  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f97316', '#3b82f6', '#059669']

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (pass.length < 6) return setErr('Password must be at least 6 characters.')
    if (pass !== confirm) return setErr('Passwords do not match.')

    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: pass }),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        // Auto-login — save token & user if context supports it
        if (data.token && typeof setUserFromToken === 'function') {
          setUserFromToken(data.token, data.user)
        }
        setTimeout(() => navigate('/'), 2500)
      } else {
        setErr(data.error || 'Something went wrong.')
      }
    } catch {
      setErr('Network error. Please try again.')
    }
    setLoading(false)
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

      <div className="auth-tags" aria-hidden="true">
        {TAGS.map(t => (
          <span key={t.label} className="auth-tag" style={{
            left: t.left, bottom: '-60px',
            animationDuration: t.dur, animationDelay: t.delay, '--r': t.r,
          }}>{t.label}</span>
        ))}
      </div>

      {/* Card */}
      <div className="auth-card">

        <div className="auth-logo-block">
          <img src={logo} alt="HungryHub" />
          <span>Hungry<b>Hub</b></span>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(5,150,105,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={32} color="#059669" />
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.1rem' }}>Password Reset!</h3>
            <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,.65)', fontSize: '.87rem', lineHeight: 1.6 }}>
              Your password has been updated. Redirecting you to home…
            </p>
            <div style={{ height: 4, background: 'rgba(255,255,255,.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#C9952A', animation: 'progressBar 2.5s linear forwards' }} />
            </div>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <h1>Set New Password</h1>
              <div className="auth-divider" />
              <p style={{ marginTop: 10 }}>Choose a strong password for your account.</p>
            </div>

            {err && (
              <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={15} style={{ flexShrink: 0 }} /> {err}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">

              {/* New Password */}
              <div className="form-group">
                <label>New Password</label>
                <div className="input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showP ? 'text' : 'password'}
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="Min. 6 characters"
                    required autoFocus
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowP(p => !p)}>
                    {showP ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength bar */}
                {pass.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,.15)',
                          transition: 'background .3s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '.73rem', color: strengthColor[strength] }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showC ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowC(p => !p)}>
                    {showC ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirm.length > 0 && pass !== confirm && (
                  <p style={{ margin: '5px 0 0', fontSize: '.74rem', color: '#ef4444' }}>
                    Passwords don't match
                  </p>
                )}
                {confirm.length > 0 && pass === confirm && (
                  <p style={{ margin: '5px 0 0', fontSize: '.74rem', color: '#059669' }}>
                    ✓ Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary auth-submit"
                disabled={loading || pass !== confirm || pass.length < 6}
              >
                {loading ? <span className="spinner" /> : 'Reset Password'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 14, fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>
                Remember your password? <Link to="/login" style={{ color: '#C9952A' }}>Sign in</Link>
              </p>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}