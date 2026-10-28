import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Search, RefreshCw, Loader2, ExternalLink, Utensils, Hotel, Car } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import './AdminHome.css'
import './AdminBookings.css'

const TABS = [
  { id: 'orders', label: 'Food Orders', icon: <Utensils size={14} /> },
  { id: 'hotels', label: 'Hotel Bookings', icon: <Hotel size={14} /> },
  { id: 'cabs',   label: 'Cab Bookings', icon: <Car size={14} /> },
]
const PAYMENT = { cod: 'COD', card: 'Card', upi: 'UPI', wallet: 'Wallet' }
const billNo  = (prefix, id) => `${prefix}-${String(id).slice(-8).toUpperCase()}`
const fmt     = d => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const rupees  = n => `₹${Number(n || 0).toLocaleString('en-IN')}`

/* Normalise orders / hotel bookings / cabs into one bill row shape */
function toRows(tab, list) {
  if (tab === 'orders') return list.map(o => ({
    id: o._id, no: o.orderId, name: o.userName, email: o.userEmail, date: o.createdAt,
    amount: o.total, cancelled: o.status === 'cancelled',
    info: `${o.items.length} item(s) · ${PAYMENT[o.payment] || o.payment}`,
    status: o.payment !== 'cod' && o.paymentStatus === 'paid' ? 'Paid' : o.status === 'delivered' ? 'Delivered' : o.status.replace(/_/g, ' '),
    href: `/invoice/${o._id}`,
  }))
  if (tab === 'hotels') return list.map(b => {
    const cabAmt = b.cab && b.cab.status !== 'cancelled' ? b.cab.estimatedFare : 0
    return {
      id: b._id, no: billNo('HB', b._id), name: b.name, email: b.email, date: b.createdAt,
      amount: b.status === 'cancelled' ? cabAmt : b.totalAmount + cabAmt, cancelled: b.status === 'cancelled',
      info: `${b.hotelName} · ${b.nights} night(s)${b.cab ? ' + cab' : ''}`,
      status: b.status, href: `/booking-bill/hotel/${b._id}`,
    }
  })
  return list.map(c => ({
    id: c._id, no: billNo('CB', c._id), name: c.name, email: c.email, date: c.createdAt,
    amount: c.status === 'cancelled' ? 0 : c.estimatedFare, cancelled: c.status === 'cancelled',
    info: `${c.carType.toUpperCase()} · ${c.linkedType === 'none' ? 'Standalone' : c.linkedType}`,
    status: c.status, href: c.linkedType === 'hotel' && c.linkedId ? `/booking-bill/hotel/${c.linkedId._id || c.linkedId}` : `/booking-bill/cab/${c._id}`,
  }))
}

export default function AdminBills() {
  const { getToken } = useAuth()
  const [tab, setTab]         = useState('orders')
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const url = tab === 'orders' ? `${API_BASE}/orders?limit=500`
        : tab === 'hotels' ? `${API_BASE}/hotels/bookings` : `${API_BASE}/cabs`
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setRows(toRows(tab, tab === 'orders' ? data.orders : data.data))
    } catch (err) {
      setRows([]); setError(err.message || 'Could not load bills.')
    } finally { setLoading(false) }
  }, [tab, getToken])

  useEffect(() => { load() }, [load])

  const q = search.trim().toLowerCase()
  const shown = rows.filter(r => !q || [r.no, r.name, r.email, r.info].some(v => String(v || '').toLowerCase().includes(q)))
  const billed = shown.filter(r => !r.cancelled).reduce((s, r) => s + r.amount, 0)

  return (
    <div className="admin-home-page">
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="dash-title">Bills</h1>
          <p className="dash-sub">All customer bills — food orders, hotel and cab bookings. Open any bill to view or print it.</p>
        </div>
        <button className="ab-btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="ab-toolbar">
        {TABS.map(t => (
          <button key={t.id} className={`ab-pill ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); setSearch('') }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="ab-bill-stats">
        <div><span>Bills</span><strong>{shown.length}</strong></div>
        <div><span>Total billed</span><strong>{rupees(billed)}</strong></div>
        <div className="ab-bill-search">
          <Search size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bill no., customer, email…" />
        </div>
      </div>

      {loading ? <div className="ab-empty"><Loader2 size={26} className="spin-icon" /></div>
        : error ? <div className="ab-empty">{error}</div>
        : shown.length === 0 ? <div className="ab-empty">No bills found.</div>
        : (
          <div className="ab-bill-table-wrap">
            <table className="ab-bill-table">
              <thead>
                <tr><th>Bill No.</th><th>Customer</th><th>Details</th><th>Date</th><th>Status</th><th className="r">Amount</th><th></th></tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.id} className={r.cancelled ? 'cancelled' : ''}>
                    <td className="ab-bill-no"><FileText size={13} /> {r.no}</td>
                    <td><div className="ab-bill-name">{r.name}</div><div className="ab-bill-sub">{r.email}</div></td>
                    <td className="ab-bill-sub">{r.info}</td>
                    <td className="ab-bill-sub">{fmt(r.date)}</td>
                    <td><span className="ab-bill-status">{r.status}</span></td>
                    <td className="r ab-total">{rupees(r.amount)}</td>
                    <td className="r">
                      <a href={r.href} target="_blank" rel="noreferrer" className="ab-btn" style={{ padding: '6px 12px', textDecoration: 'none' }}>
                        <ExternalLink size={13} /> View Bill
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
