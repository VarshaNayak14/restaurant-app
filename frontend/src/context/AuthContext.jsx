import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API = 'https://restaurant-app-1-4jis.onrender.com/api'

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

  const isAdmin = user?.role === 'admin'

  // FIX: loading ke time bhi children render karo, sirf spinner dikhao
  // Isse navigate('/admin') kaam karega bina block ke
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, saveOrder, isAdmin, getToken, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }