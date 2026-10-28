import React, { useEffect, useMemo, useState } from 'react'
import { MapPin, Star, Search, X, Loader2, BedDouble, Users, CalendarDays, Car } from 'lucide-react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../data/dishes.js'
import CabAddon, { emptyCab, validateCab, buildCabPayload } from '../components/CabAddon.jsx'
import LoginToBook from '../components/LoginToBook.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Bookings.css'
import './HotelDetail.css'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
const emptyForm = { name: '', email: '', phone: '', checkIn: '', checkOut: '', guests: 2, rooms: 1, message: '' }

export default function Hotels() {
  const [hotels, setHotels]   = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity]       = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/hotels`)
      .then(r => r.json())
      .then(d => { if (d.success) setHotels(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const shown = hotels.filter(h =>
    !city ||
    h.city.toLowerCase().includes(city.toLowerCase()) ||
    h.name.toLowerCase().includes(city.toLowerCase())
  )

  return (
    <div className="page-wrapper bk-page">
      <div className="bk-banner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&fit=crop')" }}>
        <div className="bk-banner-overlay" />
        <div className="bk-banner-text">
          <h1>Book a <span>Hotel</span></h1>
          <p>Comfortable stays — add a cab for your pickup and drop</p>
        </div>
      </div>

      <div className="container">
        <div className="bk-search">
          <Search size={18} />
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Search by city or hotel name…" />
        </div>

        {loading ? (
          <div className="bk-empty"><Loader2 size={28} className="bk-spin" /> Loading hotels…</div>
        ) : shown.length === 0 ? (
          <div className="bk-empty">No hotels found.</div>
        ) : (
          <div className="bk-grid">
            {shown.map(h => (
              <div className="bk-card" key={h._id}>
                <Link to={`/hotels/${h._id}`} className="bk-card-img">
                  <img src={h.image || 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&fit=crop'} alt={h.name} />
                  <span className="bk-rating"><Star size={12} fill="currentColor" /> {h.rating}</span>
                </Link>
                <div className="bk-card-body">
                  <h3><Link to={`/hotels/${h._id}`} className="bk-card-title">{h.name}</Link></h3>
                  <p className="bk-loc"><MapPin size={13} /> {h.address ? `${h.address}, ` : ''}{h.city}</p>
                  {h.description && <p className="bk-desc">{h.description}</p>}
                  {h.amenities?.length > 0 && (
                    <div className="bk-tags">{h.amenities.map(a => <span key={a}>{a}</span>)}</div>
                  )}
                  <div className="bk-card-foot">
                    <div><strong>₹{h.pricePerNight}</strong><small> / night</small></div>
                    <div className="bk-card-btns">
                      <Link to={`/hotels/${h._id}`} className="btn-outline">View Details</Link>
                      <button className="btn-primary" onClick={() => setSelected(h)}>Book Now</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <HotelBookingModal hotel={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// Also used by the hotel detail page
export function HotelBookingModal({ hotel, onClose }) {
  const [form, setForm] = useState({ ...emptyForm, checkIn: today(), checkOut: addDays(today(), 1) })

  // ← NEW: logged-in user's name/email prefilled so the booking shows in Profile → My Bookings
  const { user, getToken } = useAuth()
  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }))
  }, [user, hotel._id])
  const [cab, setCab]   = useState(emptyCab)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]   = useState('')
  const [result, setResult] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const nights = Math.max(0, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
  const total  = nights * Math.max(1, Number(form.rooms) || 1) * hotel.pricePerNight
  const venueAddress = [hotel.name, hotel.address, hotel.city].filter(Boolean).join(', ')

  // Suggested cab times: pickup on check-in day, return on check-out day
  const suggestedPickup = useMemo(() => form.checkIn ? `${form.checkIn}T11:00` : '', [form.checkIn])
  const suggestedReturn = useMemo(() => form.checkOut ? `${form.checkOut}T11:30` : '', [form.checkOut])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.checkIn || !form.checkOut) return setError('Name, email and dates are required.')
    if (nights < 1) return setError('Check-out must be at least 1 day after check-in.')
    const cabErr = validateCab(cab)
    if (cabErr) return setError(cabErr)

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/hotels/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...form,
          hotelId: hotel._id,
          cab: cab.enabled ? buildCabPayload(cab, venueAddress) : undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Booking failed')
      setResult(data.data)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bk-modal-bg" onClick={onClose}>
      <div className="bk-modal" onClick={e => e.stopPropagation()}>
        <button className="bk-modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>

        {!user ? (
          <LoginToBook what="book a hotel" />
        ) : result ? (
          <div className="bk-success">
            <div className="bk-success-check">✓</div>
            <h2>Booking Request Received!</h2>
            <p>{hotel.name} — {result.booking.nights} night(s), {result.booking.rooms} room(s)</p>
            <div className="bk-summary">
              <div><span>Hotel total</span><strong>₹{result.booking.totalAmount}</strong></div>
              {result.cab && <div><span><Car size={14} /> Cab ({result.cab.carType}, {result.cab.tripType})</span><strong>₹{result.cab.estimatedFare}</strong></div>}
            </div>
            <p className="bk-muted">We will confirm shortly. {result.cab && 'Driver details will be shared after confirmation.'}</p>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2 className="bk-modal-title">{hotel.name}</h2>
            <p className="bk-loc"><MapPin size={13} /> {venueAddress}</p>

            <form className="bk-form" onSubmit={handleSubmit}>
              <div className="bk-row">
                <div className="bk-field"><label>Full Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required /></div>
                <div className="bk-field"><label>Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
              </div>
              <div className="bk-field"><label>Email *</label>
                <input type="email" readOnly value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required /></div>
              <div className="bk-row">
                <div className="bk-field"><label><CalendarDays size={13} /> Check-in *</label>
                  <input type="date" min={today()} value={form.checkIn} onChange={e => set('checkIn', e.target.value)} required /></div>
                <div className="bk-field"><label><CalendarDays size={13} /> Check-out *</label>
                  <input type="date" min={form.checkIn || today()} value={form.checkOut} onChange={e => set('checkOut', e.target.value)} required /></div>
              </div>
              <div className="bk-row">
                <div className="bk-field"><label><Users size={13} /> Guests</label>
                  <input type="number" min={1} max={20} value={form.guests} onChange={e => set('guests', e.target.value)} /></div>
                <div className="bk-field"><label><BedDouble size={13} /> Rooms</label>
                  <input type="number" min={1} max={hotel.totalRooms || 10} value={form.rooms} onChange={e => set('rooms', e.target.value)} /></div>
              </div>
              <div className="bk-field"><label>Special Requests</label>
                <textarea rows={2} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Early check-in, extra bed…" /></div>

              <CabAddon
                cab={cab}
                setCab={setCab}
                venueName={hotel.name}
                venueAddress={venueAddress}
                suggestedPickup={suggestedPickup}
                suggestedReturn={suggestedReturn}
              />

              <div className="bk-total">
                <span>{nights} night(s) × {form.rooms} room(s) × ₹{hotel.pricePerNight}</span>
                <strong>₹{total}</strong>
              </div>

              {error && <div className="bk-error">{error}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                {submitting ? <><Loader2 size={15} className="bk-spin" /> Booking…</> : cab.enabled ? 'Book Hotel + Cab' : 'Book Hotel'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
