import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)
const API = 'https://restaurant-app-1-4jis.onrender.com/api'

export function CartProvider({ children }) {
  const { user, getToken } = useAuth()
  const [cart, setCart]           = useState([])
  const [notification, setNotif]  = useState(null)
  const [loading, setLoading]     = useState(false)

  // ── Helper: auth headers ──
  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    }
  }

  // ── On login: fetch cart from backend ──
  useEffect(() => {
    if (!user) {
      setCart([])   // logout → clear local state
      return
    }
    setLoading(true)
    fetch(`${API}/cart`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { if (data.success) setCart(data.cart) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // ── Add to cart ──
  async function addToCart(dish) {
    // Optimistic update
    setCart(prev => {
      const ex = prev.find(i => i.id === dish.id)
      if (ex) return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...dish, qty: 1 }]
    })
    setNotif(dish.name)
    setTimeout(() => setNotif(null), 2200)

    if (!user) return   // not logged in → only local state

    try {
      const res  = await fetch(`${API}/cart`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ dish }),
      })
      const data = await res.json()
      if (data.success) setCart(data.cart)
    } catch {}
  }

  // ── Remove from cart ──
  async function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id))   // optimistic

    if (!user) return

    try {
      const res  = await fetch(`${API}/cart/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (data.success) setCart(data.cart)
    } catch {}
  }

  // ── Update quantity ──
  async function updateQty(id, qty) {
    if (qty < 1) { removeFromCart(id); return }

    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))   // optimistic

    if (!user) return

    try {
      const res  = await fetch(`${API}/cart/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ qty }),
      })
      const data = await res.json()
      if (data.success) setCart(data.cart)
    } catch {}
  }

  // ── Clear cart ──
  async function clearCart() {
    setCart([])

    if (!user) return

    try {
      await fetch(`${API}/cart`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    } catch {}
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQty, clearCart,
      total, count, notification, loading,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() { return useContext(CartContext) }