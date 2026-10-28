import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'

/* Shown instead of a booking form when the user is not logged in.
   After login / sign up the user is sent back to the current page. */
export default function LoginToBook({ what = 'make a booking' }) {
  const location = useLocation()
  const back = encodeURIComponent(location.pathname + location.search)
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14,
      padding: '40px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(201,149,42,.15)', color: 'var(--primary)',
      }}>
        <Lock size={26} />
      </div>
      <h2 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '1.4rem' }}>Please log in to {what}</h2>
      <p style={{ margin: 0, color: 'var(--text-mid)', fontSize: '.92rem', maxWidth: 380 }}>
        Your bookings are saved to your account so you can track them anytime under <strong>Profile → My Bookings</strong>.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to={`/login?redirect=${back}`} className="btn-primary">Login</Link>
        <Link to={`/register?redirect=${back}`} className="btn-outline">Create Account</Link>
      </div>
    </div>
  )
}
