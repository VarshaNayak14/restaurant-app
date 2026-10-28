import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Hotel, Car, CalendarCheck, Clock, MapPin, Users, BedDouble, Phone, Loader2, User, FileText, Star } from 'lucide-react'
import { API_BASE } from '../data/dishes.js'
import { useAuth } from '../context/AuthContext.jsx'
import './MyBookings.css'

const STATUS = {
  pending:   { label: 'Pending',         color: '#2563eb' },
  confirmed: { label: 'Confirmed',       color: '#059669' },
  assigned:  { label: 'Driver Assigned', color: '#7c3aed' },
  completed: { label: 'Completed',       color: '#6b7280' },
  cancelled: { label: 'Cancelled',       color: '#dc2626' },
}
const CAR_LABEL  = { auto: 'Auto', mini: 'Mini', sedan: 'Sedan', suv: 'SUV' }
const TRIP_LABEL = { pickup: 'Pickup only', drop: 'Drop only', round: 'Round trip' }

const FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'hotel',       label: 'Hotels' },
  { id: 'reservation', label: 'Tables' },
  { id: 'cab',         label: 'Cabs' },
]

function fmt(str, withTime = true) {
  if (!str) return '—'
  const d = new Date(str)
  if (isNaN(d)) return str
  return d.toLocaleString('en-IN', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' })
}

function Status({ status }) {
  const s = STATUS[status] || STATUS.pending
  return <span className="mb-status" style={{ color: s.color, background: s.color + '1f' }}>{s.label}</span>
}

/* Star picker + comment — shown after check-out */
function ReviewBox({ booking, token, onDone }) {
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!rating) return setErr('Please select a star rating.')
    setSaving(true); setErr('')
    try {
      const res  = await fetch(`${API_BASE}/hotel-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: booking._id, rating, comment }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onDone()
    } catch (e2) { setErr(e2.message || 'Could not save your review.') }
    finally { setSaving(false) }
  }

  return (
    <form className="mb-review" onSubmit={submit}>
      <strong>How was your stay at {booking.hotelName}?</strong>
      <div className="mb-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button type="button" key={n} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star size={24} fill={n <= (hover || rating) ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <textarea rows={3} maxLength={1000} placeholder="Share your experience (optional)" value={comment} onChange={e => setComment(e.target.value)} />
      {err && <div className="mb-review-err">{err}</div>}
      <button className="btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit Review'}</button>
    </form>
  )
}

function StaticStars({ value }) {
  return (
    <span className="mb-stars mb-stars-static">
      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={15} fill={n <= value ? 'currentColor' : 'none'} />)}
    </span>
  )
}

/* Cab details — shown inside a booking card or as its own card */
function CabInfo({ cab }) {
  return (
    <div className="mb-cab">
      <div className="mb-cab-head">
        <span><Car size={14} /> {CAR_LABEL[cab.carType] || cab.carType} · {TRIP_LABEL[cab.tripType]}</span>
        <Status status={cab.status} />
      </div>
      <div className="mb-line"><MapPin size={13} /> {cab.pickupAddress} → {cab.dropAddress}</div>
      {cab.pickupTime && <div className="mb-line"><Clock size={13} /> Pickup: {fmt(cab.pickupTime)}</div>}
      {cab.returnTime && <div className="mb-line"><Clock size={13} /> Return: {fmt(cab.returnTime)}</div>}
      {cab.driverName && (
        <div className="mb-driver">
          <span><User size={13} /> {cab.driverName}</span>
          {cab.driverPhone && <a href={`tel:${cab.driverPhone}`}><Phone size={13} /> {cab.driverPhone}</a>}
          {cab.vehicleNumber && <span>🚘 {cab.vehicleNumber}</span>}
        </div>
      )}
      <div className="mb-line mb-fare">Estimated fare: ₹{cab.estimatedFare}</div>
    </div>
  )
}

export default function MyBookings() {
  const { getToken } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('all')
  const [busy, setBusy]       = useState('')
  const [reviewing, setReviewing] = useState('')   // booking id whose review form is open

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API_BASE}/my-bookings`, { headers: { Authorization: `Bearer ${getToken()}` } })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (err) {
      setError(err.message || 'Could not load your bookings.')
    } finally { setLoading(false) }
  }, [getToken])

  useEffect(() => { load() }, [load])

  async function cancel(type, id) {
    if (!confirm('Cancel this booking?')) return
    setBusy(id)
    try {
      const res  = await fetch(`${API_BASE}/my-bookings/${type}/${id}/cancel`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` },
      })
      const json = await res.json()
      if (!json.success) return alert(json.error)
      load()
    } finally { setBusy('') }
  }

  const CancelBtn = ({ type, item }) => item.status === 'pending' && (
    <button className="mb-cancel" disabled={busy === item._id} onClick={() => cancel(type, item._id)}>
      {busy === item._id ? 'Cancelling…' : 'Cancel booking'}
    </button>
  )

  if (loading) return <div className="mb-empty"><Loader2 size={20} className="spin" /> Loading bookings…</div>
  if (error)   return <div className="mb-empty">{error}</div>

  // One combined list, newest first
  const items = [
    ...data.hotelBookings.map(b => ({ type: 'hotel', b })),
    ...data.reservations.map(b => ({ type: 'reservation', b })),
    ...data.cabs.map(b => ({ type: 'cab', b })),
  ]
    .filter(i => filter === 'all' || i.type === filter)
    .sort((a, b) => new Date(b.b.createdAt) - new Date(a.b.createdAt))

  return (
    <div>
      <div className="mb-filters">
        {FILTERS.map(f => (
          <button key={f.id} className={`mb-filter ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mb-empty mb-empty-box">
          <CalendarCheck size={48} strokeWidth={1.2} />
          <p>No bookings yet.</p>
          <div className="mb-empty-links">
            <Link to="/hotels" className="btn-primary">Book a Hotel</Link>
            <Link to="/cabs" className="btn-outline">Book a Cab</Link>
            <Link to="/contact" className="btn-outline">Reserve a Table</Link>
          </div>
        </div>
      ) : items.map(({ type, b }) => (
        <div className="mb-card" key={type + b._id}>
          {type === 'hotel' && (
            <>
              <div className="mb-head">
                <div className="mb-title"><Hotel size={18} /> {b.hotelName}</div>
                <Status status={b.status} />
              </div>
              <div className="mb-grid">
                <div className="mb-line"><Clock size={13} /> {fmt(b.checkIn, false)} → {fmt(b.checkOut, false)} ({b.nights} night{b.nights > 1 ? 's' : ''})</div>
                <div className="mb-line"><Users size={13} /> {b.guests} guest(s) · <BedDouble size={13} /> {b.rooms} room(s)</div>
              </div>
              <div className="mb-total">Total: ₹{b.totalAmount}</div>
            </>
          )}

          {type === 'reservation' && (
            <>
              <div className="mb-head">
                <div className="mb-title"><CalendarCheck size={18} /> Table at Hungry Hub</div>
                <Status status={b.status} />
              </div>
              <div className="mb-grid">
                <div className="mb-line"><Clock size={13} /> {fmt(b.date)}</div>
                <div className="mb-line"><Users size={13} /> {b.guests} guest(s)</div>
              </div>
            </>
          )}

          {type === 'cab' && (
            <div className="mb-head">
              <div className="mb-title"><Car size={18} /> Cab Booking</div>
            </div>
          )}

          {type === 'hotel' && b.review && (
            <div className="mb-review-done">
              <StaticStars value={b.review.rating} /> <span>Your review{b.review.comment ? `: “${b.review.comment}”` : ''}</span>
            </div>
          )}
          {type === 'hotel' && b.canReview && (
            reviewing === b._id
              ? <ReviewBox booking={b} token={getToken()} onDone={() => { setReviewing(''); load() }} />
              : <button className="mb-rate-btn" onClick={() => setReviewing(b._id)}><Star size={14} /> Rate your stay</button>
          )}

          {b.adminNote && <div className="mb-note">Note from us: {b.adminNote}</div>}
          {type === 'cab' ? <CabInfo cab={b} /> : b.cab && <CabInfo cab={b.cab} />}

          <div className="mb-foot">
            <span>Booked on {fmt(b.createdAt)}</span>
            <span className="mb-foot-actions">
              {/* Bill: hotel (incl. its cab), standalone cab, or the cab of a table reservation */}
              {type === 'hotel' && <Link to={`/booking-bill/hotel/${b._id}`} className="mb-bill"><FileText size={13} /> View Bill</Link>}
              {type === 'cab' && <Link to={`/booking-bill/cab/${b._id}`} className="mb-bill"><FileText size={13} /> View Bill</Link>}
              {type === 'reservation' && b.cab && <Link to={`/booking-bill/cab/${b.cab._id}`} className="mb-bill"><FileText size={13} /> Cab Bill</Link>}
              <CancelBtn type={type} item={b} />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}