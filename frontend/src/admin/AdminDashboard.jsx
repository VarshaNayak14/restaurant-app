import React, { useMemo, useState, useEffect } from 'react'
import {
  ShoppingBag, Users, TrendingUp, Star,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  ChefHat, Package, Flame, Leaf, Loader2
} from 'lucide-react'
import { fetchDishes } from '../data/dishes.js'
import { useAuth } from '../context/AuthContext.jsx'
import './AdminDashboard.css'

const API = 'http://localhost:5000/api'

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_COLORS = {
  delivered:        { bg: '#d1fae5', text: '#065f46' },
  preparing:        { bg: '#fef3c7', text: '#92400e' },
  confirmed:        { bg: '#dbeafe', text: '#1e40af' },
  out_for_delivery: { bg: '#ede9fe', text: '#5b21b6' },
  cancelled:        { bg: '#fee2e2', text: '#991b1b' },
}
const STATUS_LABEL = {
  delivered: 'Delivered', preparing: 'Preparing', confirmed: 'Confirmed',
  out_for_delivery: 'Out for Delivery', cancelled: 'Cancelled',
}

/* ── "x min/hr ago" from a timestamp ── */
function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins   = Math.floor(diffMs / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} day ago`
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function pctChange(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.confirmed
  return (
    <span className="status-badge" style={{ background: s.bg, color: s.text }}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

/* ── Mini bar chart ── */
function BarChart({ data, labels }) {
  const max = Math.max(...data)
  return (
    <div className="bar-chart">
      {data.map((v, i) => (
        <div key={i} className="bar-col">
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ height: `${(v / max) * 100}%` }}
              title={`₹${v.toLocaleString()}`}
            />
          </div>
          <span className="bar-label">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Donut chart ── */
function DonutChart({ segments }) {
  // segments: [{value, color, label}]
  const total = segments.reduce((s, x) => s + x.value, 0)
  let offset = 0
  const R = 40; const C = 2 * Math.PI * R
  const slices = segments.map(seg => {
    const dash = (seg.value / total) * C
    const slice = { ...seg, dash, offset }
    offset += dash
    return slice
  })
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 100 100" className="donut-svg">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f0f0f0" strokeWidth="16" />
        {slices.map((s, i) => (
          <circle
            key={i} cx="50" cy="50" r={R}
            fill="none" stroke={s.color} strokeWidth="16"
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={C / 4 - s.offset}
            style={{ transition: 'stroke-dasharray .6s ease' }}
          />
        ))}
        <text x="50" y="46" textAnchor="middle" className="donut-center-label">Total</text>
        <text x="50" y="58" textAnchor="middle" className="donut-center-value">{total}</text>
      </svg>
      <div className="donut-legend">
        {segments.map((s, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-dot" style={{ background: s.color }} />
            <span className="donut-legend-label">{s.label}</span>
            <span className="donut-legend-val">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { getToken } = useAuth()
  const [dishes, setDishes]   = useState([])
  const [orders, setOrders]   = useState([])
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function authH() {
      return { Authorization: `Bearer ${getToken()}` }
    }
    setLoading(true)
    Promise.all([
      fetchDishes().catch(() => []),
      fetch(`${API}/orders?limit=500`, { headers: authH() }).then(r => r.json()).catch(() => null),
      fetch(`${API}/orders/admin/stats`, { headers: authH() }).then(r => r.json()).catch(() => null),
      fetch(`${API}/auth/users`, { headers: authH() }).then(r => r.json()).catch(() => null),
      fetch(`${API}/reviews`, { headers: authH() }).then(r => r.json()).catch(() => null),
    ]).then(([dishData, orderData, statData, userData, reviewData]) => {
      setDishes(dishData || [])
      if (orderData?.success) setOrders(orderData.orders)
      if (statData?.success)  setStats(statData.stats)
      if (userData?.success)  setUsers(userData.users)
      if (reviewData?.success) setReviews(reviewData.reviews)
    }).finally(() => setLoading(false))
  }, [])

  const totalDishes = dishes.length
  const vegCount    = dishes.filter(d => d.tag === 'Veg').length
  const nonVegCount = totalDishes - vegCount

  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const weekAgo   = new Date(now); weekAgo.setDate(now.getDate() - 6); weekAgo.setHours(0,0,0,0)

  const todayOrdersList     = useMemo(() => orders.filter(o => isSameDay(new Date(o.createdAt), now)), [orders])
  const yesterdayOrdersList = useMemo(() => orders.filter(o => isSameDay(new Date(o.createdAt), yesterday)), [orders])

  const todayOrders    = todayOrdersList.length
  const todayRevenue   = todayOrdersList.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const yestOrders     = yesterdayOrdersList.length
  const yestRevenue    = yesterdayOrdersList.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)

  const revenueChange  = pctChange(todayRevenue, yestRevenue)
  const ordersChange   = todayOrders - yestOrders

  const totalUsers     = users.length
  const usersThisWeek  = users.filter(u => new Date(u.createdAt) >= weekAgo).length

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
  }, [reviews])

  const orderStats = stats || {
    delivered: 0, preparing: 0, confirmed: 0, out_for_delivery: 0, cancelled: 0,
  }

  /* ── Weekly revenue (last 7 days incl. today), non-cancelled orders ── */
  const { weekRevenue, weekLabels } = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i)
      days.push(d)
    }
    const revenue = days.map(d =>
      orders
        .filter(o => o.status !== 'cancelled' && isSameDay(new Date(o.createdAt), d))
        .reduce((s, o) => s + o.total, 0)
    )
    const labels = days.map(d => WEEK_LABELS[(d.getDay() + 6) % 7])
    return { weekRevenue: revenue, weekLabels: labels }
  }, [orders])

  /* ── Top dishes by order count, derived from real order items ── */
  const topDishes = useMemo(() => {
    const map = {}
    orders.forEach(o => {
      if (o.status === 'cancelled') return
      o.items.forEach(item => {
        if (!map[item.name]) {
          const dish = dishes.find(d => d.id === item.id || d.name === item.name)
          map[item.name] = { name: item.name, orders: 0, revenue: 0, tag: dish?.tag || 'Veg' }
        }
        map[item.name].orders  += item.qty
        map[item.name].revenue += item.price * item.qty
      })
    })
    return Object.values(map).sort((a, b) => b.orders - a.orders).slice(0, 5)
  }, [orders, dishes])

  const recentOrders = orders.slice(0, 7)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '60px 0', color: '#7a8fa0' }}>
        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
        Loading dashboard…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">

      {/* Page header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">Welcome back, Admin here's what's happening today.</p>
        </div>
        <div className="dash-date">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-gold">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-label">Today's Revenue</span>
            <span className="kpi-value">₹{todayRevenue.toLocaleString('en-IN')}</span>
            <span className={`kpi-change ${revenueChange >= 0 ? 'up' : 'down'}`}>
              {revenueChange >= 0 ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
              {revenueChange >= 0 ? '+' : ''}{revenueChange}% vs yesterday
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-icon"><ShoppingBag size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-label">Orders Today</span>
            <span className="kpi-value">{todayOrders}</span>
            <span className={`kpi-change ${ordersChange >= 0 ? 'up' : 'down'}`}>
              {ordersChange >= 0 ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
              {ordersChange >= 0 ? '+' : ''}{ordersChange} vs yesterday
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-label">Total Users</span>
            <span className="kpi-value">{totalUsers}</span>
            <span className="kpi-change up"><ArrowUpRight size={13}/> +{usersThisWeek} this week</span>
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-icon"><Star size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-label">Avg. Rating</span>
            <span className="kpi-value">{avgRating || '—'}</span>
            <span className="kpi-change up">{reviews.length} review{reviews.length !== 1 ? 's' : ''} total</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Revenue Chart + Order Status ── */}
      <div className="dash-row2">

        {/* Revenue Chart */}
        <div className="dash-card chart-card">
          <div className="card-head">
            <h3 className="card-title">Weekly Revenue</h3>
            <span className="card-badge">This Week</span>
          </div>
          <div className="chart-total">
            <span className="chart-total-val">₹{weekRevenue.reduce((a,b)=>a+b,0).toLocaleString('en-IN')}</span>
            <span className="chart-total-label">Total this week</span>
          </div>
          <BarChart data={weekRevenue.some(v => v > 0) ? weekRevenue : [1,1,1,1,1,1,1]} labels={weekLabels} />
        </div>

        {/* Order status donut */}
        <div className="dash-card donut-card">
          <div className="card-head">
            <h3 className="card-title">Order Status</h3>
            <span className="card-badge">All Time</span>
          </div>
          <DonutChart segments={
            [
              { value: orderStats.delivered,        color: '#10b981', label: 'Delivered' },
              { value: orderStats.preparing,        color: '#f59e0b', label: 'Preparing' },
              { value: orderStats.confirmed,        color: '#3b82f6', label: 'Confirmed' },
              { value: orderStats.out_for_delivery, color: '#8b5cf6', label: 'Out for Delivery' },
              { value: orderStats.cancelled,        color: '#ef4444', label: 'Cancelled' },
            ].some(s => s.value > 0)
              ? [
                  { value: orderStats.delivered,        color: '#10b981', label: 'Delivered' },
                  { value: orderStats.preparing,        color: '#f59e0b', label: 'Preparing' },
                  { value: orderStats.confirmed,        color: '#3b82f6', label: 'Confirmed' },
                  { value: orderStats.out_for_delivery, color: '#8b5cf6', label: 'Out for Delivery' },
                  { value: orderStats.cancelled,        color: '#ef4444', label: 'Cancelled' },
                ]
              : [{ value: 1, color: '#e5e7eb', label: 'No orders yet' }]
          } />
        </div>

        {/* Menu stats */}
        <div className="dash-card menu-stat-card">
          <div className="card-head">
            <h3 className="card-title">Menu Overview</h3>
          </div>
          <div className="menu-stat-big">
            <ChefHat size={28} className="menu-stat-icon" />
            <span className="menu-stat-number">{totalDishes}</span>
            <span className="menu-stat-label">Total Dishes</span>
          </div>
          <div className="menu-stat-pills">
            <div className="menu-pill veg">
              <Leaf size={13}/> {vegCount} Veg
            </div>
            <div className="menu-pill nonveg">
              <Flame size={13}/> {nonVegCount} Non-Veg
            </div>
          </div>
          <div className="menu-stat-row">
            <div className="menu-mini-stat">
              <Package size={15}/> <span>{Math.floor(totalDishes * 0.7)} in stock</span>
            </div>
            <div className="menu-mini-stat">
              <Clock size={15}/> <span>Avg 22 min delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent Orders + Top Dishes ── */}
      <div className="dash-row3">

        {/* Recent Orders */}
        <div className="dash-card orders-card">
          <div className="card-head">
            <h3 className="card-title">Recent Orders</h3>
            <span className="card-badge">{orders.length} orders</span>
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '.85rem', padding: '20px 0' }}>No orders yet.</p>
          ) : (
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o._id}>
                      <td className="order-id">{o.orderId}</td>
                      <td className="order-customer">
                        <div className="order-av">{(o.userName || '?')[0].toUpperCase()}</div>
                        {o.userName}
                      </td>
                      <td className="order-items">{o.items.map(i => i.name).join(', ')}</td>
                      <td className="order-amount">₹{o.total}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="order-time">{timeAgo(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Dishes */}
        <div className="dash-card top-dishes-card">
          <div className="card-head">
            <h3 className="card-title">Top Dishes</h3>
            <span className="card-badge">By Orders</span>
          </div>
          {topDishes.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '.85rem', padding: '20px 0' }}>No orders yet.</p>
          ) : (
            <div className="top-dishes-list">
              {topDishes.map((d, i) => (
                <div key={d.name} className="top-dish-row">
                  <span className="top-dish-rank">#{i + 1}</span>
                  <div className="top-dish-info">
                    <span className="top-dish-name">{d.name}</span>
                    <span className={`top-dish-tag ${d.tag === 'Veg' ? 'tag-veg' : 'tag-nonveg'}`}>
                      {d.tag === 'Veg' ? <Leaf size={10}/> : <Flame size={10}/>} {d.tag}
                    </span>
                  </div>
                  <div className="top-dish-right">
                    <span className="top-dish-orders">{d.orders} orders</span>
                    <span className="top-dish-rev">₹{d.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="top-dish-bar-track">
                    <div
                      className="top-dish-bar"
                      style={{ width: `${(d.orders / topDishes[0].orders) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}