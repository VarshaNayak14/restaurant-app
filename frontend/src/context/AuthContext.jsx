import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API = 'https://restaurant-app-djxk.onrender.com/api'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: if token exists, verify it with /me
  useEffect(() => {
    const token = localStorage.getItem('hh_token')
    if (!token) { setLoading(false); return }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setUser(data.user)
        else localStorage.removeItem('hh_token')
      })
      .catch(() => localStorage.removeItem('hh_token'))
      .finally(() => setLoading(false))
  }, [])

  /* ← NEW: keep the logged-in user in sync with the stored token.
     The token is shared by all tabs, so logging in/out in another tab
     (e.g. as a customer) used to leave this tab showing the old user while
     sending a different/missing token → "Token invalid or expired".
     Re-check on token change in another tab and when this tab regains focus. */
  useEffect(() => {
    function recheck() {
      const token = localStorage.getItem('hh_token')
      if (!token) { setUser(null); return }
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.success) setUser(data.user)
          else { localStorage.removeItem('hh_token'); setUser(null) }
        })
        .catch(() => {})   // server unreachable — keep current state
    }
    const onStorage = e => { if (e.key === 'hh_token' || e.key === null) recheck() }
    const onFocus   = () => { if (document.visibilityState === 'visible') recheck() }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  /* ── Register ── */
  async function register(name, email, password) {
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('hh_token', data.token)
        setUser(data.user)
        return { success: true }
      }
      return { success: false, error: data.error || 'Registration failed.' }
    } catch {
      return { success: false, error: 'Cannot connect to server. Please try again.' }
    }
  }

  /* ── Login ── */
  async function login(email, password) {
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('hh_token', data.token)
        setUser(data.user)
        return { success: true, role: data.user.role }
      }
      return { success: false, error: data.error || 'Login failed.' }
    } catch {
      return { success: false, error: 'Cannot connect to server. Please try again.' }
    }
  }

  /* ── Logout ── */
  function logout() {
    localStorage.removeItem('hh_token')
    setUser(null)
  }

  /* ── Save Order ── */
  function saveOrder(order) {
    setUser(prev => ({ ...prev, orders: [order, ...(prev?.orders || [])] }))
  }

  /* ── Token getter ── */
  function getToken() {
    return localStorage.getItem('hh_token')
  }

  /* ── Set user directly after password reset (auto-login) ── */
  function setUserFromToken(token, userData) {
    localStorage.setItem('hh_token', token)
    setUser(userData)
  }

  // ← NEW: superadmin has full access; admin only the sections in user.permissions
  const isAdmin      = user?.role === 'admin' || user?.role === 'superadmin'
  const isSuperAdmin = user?.role === 'superadmin'
  const can = perm => isSuperAdmin || (user?.role === 'admin' && (user.permissions || []).includes(perm))

  // FIX: loading ke time bhi children render karo, sirf spinner dikhao
  // Isse navigate('/admin') kaam karega bina block ke
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, saveOrder, isAdmin, isSuperAdmin, can, getToken, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }