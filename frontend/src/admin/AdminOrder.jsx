import React, { useState, useEffect, useCallback } from 'react'
import {
  Package, Search, RefreshCw, ChevronDown,
  Clock, User, MapPin, CreditCard, Filter,
  CheckCircle2, ChefHat, Bike, Home, XCircle, Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const API = 'http://localhost:5000/api'

const STATUS_META = {
  confirmed:        { label: 'Confirmed',        color: '#3b82f6', bg: '#eff6ff', icon: <CheckCircle2 size={13}/> },
  preparing:        { label: 'Preparing',         color: '#f59e0b', bg: '#fffbeb', icon: <ChefHat size={13}/> },
  out_for_delivery: { label: 'Out for Delivery',  color: '#8b5cf6', bg: '#f5f3ff', icon: <Bike size={13}/> },
  delivered:        { label: 'Delivered',          color: '#10b981', bg: '#ecfdf5', icon: <Home size={13}/> },
  cancelled:        { label: 'Cancelled',          color: '#ef4444', bg: '#fef2f2', icon: <XCircle size={13}/> },
}

const STATUS_FLOW = ['confirmed', 'preparing', 'out_for_delivery', 'delivered']

const PAYMENT_LABEL = { card: 'Card', upi: 'UPI', wallet: 'Wallet', cod: 'COD' }

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.confirmed
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: m.bg, color: m.color,
      padding: '3px 10px', borderRadius: 20,
      fontWeight: 600, fontSize: '0.75rem',
    }}>
      {m.icon} {m.label}
    </span>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--card-bg, #fff)', border: '1px solid #d0d4da',
      borderRadius: 12, padding: '18px 22px',
    }}>
      <div style={{ fontSize: '1.7rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function AdminOrders() {
  const { getToken } = useAuth()

  const [orders, setOrders]     = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilter] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)

  function authH() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 100 })
      if (filterStatus) params.set('status', filterStatus)
      if (search)       params.set('search', search)

      const [ordRes, statRes] = await Promise.all([
        fetch(`${API}/orders?${params}`, { headers: authH() }).then(r => r.json()),
        fetch(`${API}/orders/admin/stats`,  { headers: authH() }).then(r => r.json()),
      ])
      if (ordRes.success)  setOrders(ordRes.orders)
      if (statRes.success) setStats(statRes.stats)
    } catch {}
    setLoading(false)
  }, [filterStatus, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function updateStatus(orderId, status) {
    setUpdating(orderId)
    try {
      const res  = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: authH(),
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o))
      }
    } catch {}
    setUpdating(null)
  }

  return (
    <div style={{ padding: 'clamp(14px, 4vw, 28px) clamp(14px, 4vw, 32px)', color: 'black', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 700, margin: 0, color:"black"}}>Orders</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted, #888)', fontSize: '0.9rem' }}>
            View all orders here and update their status.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', border: '1px solid var(--border, #333)',
            color: 'black', padding: '8px 16px', borderRadius: 8,
            cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0,
          }}
        >
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* ── Stats row ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Orders"     value={stats.total}            color="#c9a84c"/>
          <StatCard label="Confirmed"        value={stats.confirmed}        color="#3b82f6"/>
          <StatCard label="Preparing"        value={stats.preparing}        color="#f59e0b"/>
          <StatCard label="Out for Delivery" value={stats.out_for_delivery} color="#8b5cf6"/>
          <StatCard label="Delivered"        value={stats.delivered}        color="#10b981"/>
          <StatCard label="Cancelled"        value={stats.cancelled}        color="#ef4444"/>
          <StatCard label="Revenue (₹)"      value={'₹' + (stats.revenue || 0).toLocaleString('en-IN')} color="#c9a84c"/>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, order ID…"
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              background: 'white', border: '1px solid var(--border, #333)',
              borderRadius: 8, color: 'black', fontSize: '0.87rem', boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '9px 14px', background: 'white',
            border: '1px solid var(--border, #333)', borderRadius: 8,
            color: 'black', fontSize: '0.87rem', cursor: 'pointer',
          }}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([k, m]) => (
            <option key={k} value={k}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* ── Orders list ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#888' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
          <Package size={48} strokeWidth={1.2} style={{ marginBottom: 12 }}/>
          <p>Koi order nahi mila.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => (
            <div
              key={order._id}
              style={{
                background: 'white',
                border: `1px solid ${expanded === order._id ? 'var(--primary, #c9a84c)' : 'var(--border, white)'}`,
                borderRadius: 12, overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {/* ── Row header ── */}
              <div
                onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', cursor: 'pointer',
                  flexWrap: 'wrap',
                }}
              >
                {/* Order ID */}
                <div style={{ minWidth: 130 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary, #c9a84c)' }}>
                    {order.orderId}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 1 }}>
                    {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>

                {/* Customer */}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.88rem', fontWeight: 600 }}>
                    <User size={13} style={{ color: '#888' }}/> {order.userName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>{order.userEmail}</div>
                </div>

                {/* Items preview */}
                <div style={{ flex: 1, minWidth: 120, fontSize: '0.8rem', color: '#aaa' }}>
                  {order.items.slice(0, 2).map((i, idx) => (
                    <span key={idx}>{i.name} ×{i.qty}{idx < Math.min(order.items.length, 2) - 1 ? ', ' : ''}</span>
                  ))}
                  {order.items.length > 2 && ` +${order.items.length - 2} more`}
                </div>

                {/* Total */}
                <div style={{ fontWeight: 700, fontSize: '1rem', minWidth: 70, textAlign: 'right' }}>
                  ₹{order.total}
                </div>

                {/* Status badge */}
                <StatusBadge status={order.status}/>

                {/* Expand icon */}
                <ChevronDown
                  size={16}
                  style={{
                    color: '#888',
                    transform: expanded === order._id ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </div>

              {/* ── Expanded detail ── */}
              {expanded === order._id && (
                <div style={{
                  borderTop: '1px solid var(--border, white)',
                  padding: '18px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 20,
                  boxSizing: 'border-box',
                }}>
                  {/* Left: items + bill */}
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Order Items
                    </h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        marginBottom: 8,
                      }}>
                        {item.image && (
                          <img src={item.image} alt={item.name} style={{
                            width: 40, height: 40, borderRadius: 8, objectFit: 'cover',
                          }}/>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>Qty: {item.qty}</div>
                        </div>
                        <div style={{ fontWeight: 600 }}>₹{item.price * item.qty}</div>
                      </div>
                    ))}
                    <div style={{
                      borderTop: '1px solid var(--border, #333)', marginTop: 10, paddingTop: 10,
                      fontSize: '0.82rem', color: '#aaa',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span>{order.delivery === 0 ? 'FREE' : '₹' + order.delivery}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST</span><span>₹{order.tax}</span></div>
                      {order.couponCode && order.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 600 }}>
                          <span>Coupon ({order.couponCode})</span><span>− ₹{order.discount}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'black', marginTop: 4 }}>
                        <span>Total</span><span>₹{order.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: address + payment + status control */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      <MapPin size={13} style={{ verticalAlign: -2 }}/> Delivery Address
                    </h4>
                    <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{order.address.name}</p>
                    <p style={{ margin: '0 0 2px', color: '#aaa', fontSize: '0.87rem' }}>{order.address.phone}</p>
                    <p style={{ margin: '0 0 2px', color: '#aaa', fontSize: '0.87rem' }}>{order.address.line1}</p>
                    <p style={{ margin: '0 0 16px', color: '#aaa', fontSize: '0.87rem' }}>{order.address.city} - {order.address.pin}</p>

                    <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      <CreditCard size={13} style={{ verticalAlign: -2 }}/> Payment
                    </h4>
                    <p style={{ margin: '0 0 18px', fontWeight: 600 }}>{PAYMENT_LABEL[order.payment] || order.payment}</p>

                    {/* Status update */}
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Update Status
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {STATUS_FLOW.map(s => {
                        const m  = STATUS_META[s]
                        const active = order.status === s
                        return (
                          <button
                            key={s}
                            disabled={active || updating === order._id}
                            onClick={() => updateStatus(order._id, s)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem',
                              border: `1px solid ${active ? m.color : 'var(--border, #444)'}`,
                              background: active ? m.bg : 'transparent',
                              color: active ? m.color : 'var(--text-muted, #888)',
                              cursor: active ? 'default' : 'pointer',
                              opacity: updating === order._id && !active ? 0.5 : 1,
                              fontWeight: active ? 700 : 400,
                            }}
                          >
                            {m.icon} {m.label}
                          </button>
                        )
                      })}
                      {/* Cancel button */}
                      <button
                        disabled={order.status === 'cancelled' || order.status === 'delivered' || updating === order._id}
                        onClick={() => updateStatus(order._id, 'cancelled')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem',
                          border: `1px solid ${order.status === 'cancelled' ? '#ef4444' : '#ef444455'}`,
                          background: order.status === 'cancelled' ? '#fef2f2' : 'transparent',
                          color: '#ef4444', cursor: 'pointer',
                          opacity: (order.status === 'cancelled' || order.status === 'delivered') ? 0.4 : 1,
                        }}
                      >
                        <XCircle size={13}/> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}