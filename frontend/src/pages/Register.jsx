import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '/logo.png'
import './Auth.css'

const TAGS = [
  { label: 'Dal Makhani',     left: '6%',  dur: '15s', delay: '0s',   r: '-7deg' },
  { label: 'Veg Specials',    left: '68%', dur: '19s', delay: '2s',   r: '6deg'  },
  { label: 'Award Winning',   left: '30%', dur: '17s', delay: '7s',   r: '-4deg' },
  { label: 'Quick Delivery',  left: '50%', dur: '21s', delay: '1s',   r: '9deg'  },
  { label: 'Kulfi Falooda',   left: '80%', dur: '13s', delay: '5s',   r: '-5deg' },
  { label: 'Paneer Tikka',    left: '18%', dur: '16s', delay: '10s',  r: '3deg'  },
]

function strengthLabel(p) {
  if (!p) return { label: '', color: 'transparent', width: '0%' }
  if (p.length < 4)  return { label: 'Too short', color: '#E63946', width: '20%' }
  if (p.length < 7)  return { label: 'Weak',      color: '#F4A261', width: '45%' }
  if (p.length < 10 || !/[0-9]/.test(p)) return { label: 'Good', color: '#2DC653', width: '70%' }
  return { label: 'Strong', color: '#06D6A0', width: '100%' }
}

export default function Register() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [showP, setShowP]     = useState(false)
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)
  const { register }          = useAuth()
  const navigate              = useNavigate()
  const strength              = strengthLabel(pass)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    const res = await register(name, email, pass)   // await — API call hai ab
    setLoading(false)
    if (res.success) navigate('/')
    else setErr(res.error)
  }

  return (
    <div className="auth-page">

      {/* Background */}
      <div className="auth-bg">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&h=1000&fit=crop&q=90"
          alt=""
          aria-hidden="true"
        />
        <div className="auth-bg-overlay" />
        <div className="auth-bg-grain" />
      </div>

      {/* Floating tags */}
      <div className="auth-tags" aria-hidden="true">
        {TAGS.map(t => (
          <span
            key={t.label}
            className="auth-tag"
            style={{
              left: t.left,
              bottom: '-60px',
              animationDuration: t.dur,
              animationDelay: t.delay,
              '--r': t.r,
            }}
          >{t.label}</span>
        ))}
      </div>

      {/* Glass card */}
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo-block">
          <img src={logo} alt="HungryHub" />
          <span>Hungry<b>Hub</b></span>
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <h1>Create account</h1>
          <div className="auth-divider" />
          <p style={{ marginTop: 12 }}>
            Already registered?&nbsp;
            <Link to="/login">Sign in</Link>
          </p>
        </div>

        {err && <div className="auth-error">{err}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrap">
              <User size={16} className="input-icon" />
              <input
                type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name" required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-wrap">
              <Mail size={16} className="input-icon" />
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input
                type={showP ? 'text' : 'password'} value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Min. 6 characters" required
              />
              <button type="button" className="eye-btn" onClick={() => setShowP(p => !p)}>
                {showP ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pass && (
              <div className="strength-bar-wrap">
                <div className="strength-bar" style={{ width: strength.width, background: strength.color }} />
                <span style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}