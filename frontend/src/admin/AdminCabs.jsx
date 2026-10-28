import React, { useState, useEffect, useCallback } from 'react'
import { Car, Mail, Phone, Clock, MapPin, Trash2, RefreshCw, Loader2, Users, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import './AdminHome.css'
import './AdminBookings.css'

export const CAB_STATUS = {
  pending:   { label: 'Pending',         bg: '#dbeafe', color: '#1e40af' },
  confirmed: { label: 'Confirmed',       bg: '#d1fae5', color: '#065f46' },
  assigned:  { label: 'Driver Assigned', bg: '#ede9fe', color: '#5b21b6' },
  completed: { label: 'Completed',       bg: '#e5e7eb', color: '#374151' },
  cancelled: { label: 'Cancelled',       bg: '#fee2e2', color: '#991b1b' },
}
const TRIP_LABEL = { pickup: 'Pickup (Home → Venue)', drop: 'Drop (Venue → Home)', round: 'Round trip' }
const LINK_LABEL = { restaurant: '🍽️ Restaurant', hotel: '🏨 Hotel', none: '🚖 Standalone' }

export function fmt(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (isNaN(d)) return str
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function linkedInfo(c) {
  const l = c.linkedId
  if (!l || typeof l !== 'object') return c.venueName || ''
  if (c.linkedType === 'restaurant') return `Table: ${fmt(l.date)} · ${l.guests} guests · ${l.status}`
  if (c.linkedType === 'hotel') return `${l.hotelName}: ${l.checkIn} → ${l.checkOut} · ${l.status}`
  return ''
}

export default function AdminCabs() {
  const { getToken } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('all')
  const [linked, setLinked]   = useState('all')
  const [drafts, setDrafts]   = useState({})   // id -> { driverName, driverPhone, vehicleNumber, adminNote }
  const [saving, setSaving]   = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/cabs?status=${status}&linkedType=${linked}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) setItems(data.data)
    } catch { }
    finally { setLoading(false) }
  }, [status, linked, getToken])

  useEffect(() => { fetchData() }, [fetchData])

  const draft = c => drafts[c._id] || {
    driverName: c.driverName, driverPhone: c.driverPhone, vehicleNumber: c.vehicleNumber, adminNote: c.adminNote,
  }
  const setDraft = (c, k, v) => setDrafts(d => ({ ...d, [c._id]: { ...draft(c), [k]: v } }))

  async function update(c, body) {
    setSaving(s => ({ ...s, [c._id]: true }))
    try {
      const res  = await fetch(`${API_BASE}/cabs/${c._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...draft(c), ...body }),
      })
      const data = await res.json()
      if (data.success) setItems(prev => prev.map(it => it._id === c._id ? data.data : it))
      else alert(data.error)
    } catch { }
    finally { setSaving(s => ({ ...s, [c._id]: false })) }
  }

  async function remove(c) {
    if (!confirm(`Delete cab booking of "${c.name}"?`)) return
    await fetch(`${API_BASE}/cabs/${c._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    setItems(prev => prev.filter(it => it._id !== c._id))
  }

  return (
    <div className="admin-home-page">
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="dash-title">Cab Bookings</h1>
          <p className="dash-sub">Restaurant, hotel and standalone cab requests — assign drivers.</p>
        </div>
        <button className="ab-btn" onClick={fetchData}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="ab-toolbar">
        {['all', ...Object.keys(CAB_STATUS)].map(s => (
          <button key={s} className={`ab-pill ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s === 'all' ? 'All' : CAB_STATUS[s].label}
          </button>
        ))}
        <span style={{ width: 12 }} />
        {['all', 'restaurant', 'hotel', 'none'].map(l => (
          <button key={l} className={`ab-pill ${linked === l ? 'active' : ''}`} onClick={() => setLinked(l)}>
            {l === 'all' ? 'All types' : LINK_LABEL[l]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="ab-empty"><Loader2 size={26} className="spin-icon" /></div>
      ) : items.length === 0 ? (
        <div className="ab-empty">No cab bookings yet.</div>
      ) : (
        <div className="ab-list">
          {items.map(c => {
            const s = CAB_STATUS[c.status] || CAB_STATUS.pending
            const d = draft(c)
            return (
              <div className="ab-item" key={c._id}>
                <div className="ab-item-head">
                  <div>
                    <h4><Car size={15} /> {c.name} <span className="ab-link-badge">{LINK_LABEL[c.linkedType]}</span></h4>
                    <div className="ab-meta">
                      <span><Mail size={12} /> {c.email}</span>
                      {c.phone && <span><Phone size={12} /> {c.phone}</span>}
                      <span><Users size={12} /> {c.passengers}</span>
                      <span>{c.carType.toUpperCase()} · {TRIP_LABEL[c.tripType]}</span>
                      <span className="ab-total">₹{c.estimatedFare}</span>
                    </div>
                  </div>
                  <span className="ab-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </div>

                <div className="ab-cab">
                  <div><MapPin size={12} /> <strong>{c.pickupAddress}</strong> → <strong>{c.dropAddress}</strong> ({c.distanceKm} km)</div>
                  <div style={{ marginTop: 4 }}>
                    {c.pickupTime && <span><Clock size={12} /> Pickup: <strong>{fmt(c.pickupTime)}</strong>&nbsp;&nbsp;</span>}
                    {c.returnTime && <span><Clock size={12} /> Return: <strong>{fmt(c.returnTime)}</strong></span>}
                  </div>
                  {linkedInfo(c) && <div style={{ marginTop: 4 }}>🔗 {linkedInfo(c)}</div>}
                </div>

                <div className="ab-grid">
                  <input placeholder="Driver name"    value={d.driverName}    onChange={e => setDraft(c, 'driverName', e.target.value)} />
                  <input placeholder="Driver phone"   value={d.driverPhone}   onChange={e => setDraft(c, 'driverPhone', e.target.value)} />
                  <input placeholder="Vehicle number" value={d.vehicleNumber} onChange={e => setDraft(c, 'vehicleNumber', e.target.value)} />
                  <input placeholder="Admin note"     value={d.adminNote}     onChange={e => setDraft(c, 'adminNote', e.target.value)} />
                </div>

                <div className="ab-actions">
                  <button className="ab-btn green" disabled={saving[c._id]} onClick={() => update(c, { status: 'confirmed' })}>Confirm</button>
                  <button className="ab-btn gold" disabled={saving[c._id] || !d.driverName}
                    onClick={() => update(c, { status: 'assigned' })}>Assign Driver</button>
                  <button className="ab-btn" disabled={saving[c._id]} onClick={() => update(c, { status: 'completed' })}>Completed</button>
                  <button className="ab-btn red" disabled={saving[c._id]} onClick={() => update(c, { status: 'cancelled' })}>Cancel</button>
                  <a href={`/booking-bill/cab/${c._id}`} target="_blank" rel="noreferrer" className="ab-btn" style={{ textDecoration: 'none' }}><FileText size={14} /> Bill</a>
                  <button className="ab-btn red" onClick={() => remove(c)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
