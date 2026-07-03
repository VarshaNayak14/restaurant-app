import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext.jsx'

const WishlistContext = createContext(null)
const API = 'https://restaurant-app-1-4jis.onrender.com/api'

export function WishlistProvider({ children }) {
  const { user, getToken } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading]   = useState(false)

  // ── Helper: auth headers ──
  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    }
  }

  // ── On login: fetch wishlist from backend ──
  useEffect(() => {
    if (!user) {
      setWishlist([])   // logout → clear local state
      return
    }
    setLoading(true)
    fetch(`${API}/wishlist`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { if (data.success) setWishlist(data.wishlist) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // ── Toggle wishlist (add / remove) ──
  async function toggleWishlist(dish) {
    const already = wishlist.some(i => i.id === dish.id)

    // Optimistic update
    setWishlist(prev =>
      already ? prev.filter(i => i.id !== dish.id) : [...prev, dish]
    )

    if (!user) return   // not logged in → only local state

    try {
      const res  = await fetch(`${API}/wishlist`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ dish }),
      })
      const data = await res.json()
      if (data.success) setWishlist(data.wishlist)
    } catch {}
  }

  // ── Add explicitly (used from some places) ──
  function addToWishlist(dish) {
    if (!wishlist.some(i => i.id === dish.id)) toggleWishlist(dish)
  }

  // ── Remove explicitly ──
  async function removeFromWishlist(id) {
    setWishlist(prev => prev.filter(i => i.id !== id))   // optimistic

    if (!user) return

    try {
      const res  = await fetch(`${API}/wishlist/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (data.success) setWishlist(data.wishlist)
    } catch {}
  }

  function isWishlisted(id) {
    return wishlist.some(i => i.id === id)
  }

  return (
    <WishlistContext.Provider value={{
      wishlist, addToWishlist, removeFromWishlist, toggleWishlist,
      isWishlisted, count: wishlist.length, loading,
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() { return useContext(WishlistContext) }