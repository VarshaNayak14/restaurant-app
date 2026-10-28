import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Users, Route, Loader2, Car } from 'lucide-react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../data/dishes.js'
import { useCabRates, calcFare, CarTypePicker } from '../components/CabAddon.jsx'
import LoginToBook from '../components/LoginToBook.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Bookings.css'

const emptyForm = {
  name: '', email: '', phone: '',
  pickupAddress: '', dropAddress: '',
  tripType: 'pickup', pickupTime: '', returnTime: '',
  carType: 'mini', passengers: 1, distanceKm: 5, message: '',
}

export default function CabBooking() {
  const rates = useCabRates()
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // ← NEW: logged-in user's name/email prefilled so the booking shows in Profile → My Bookings
  const { user, getToken } = useAuth()
  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }))
  }, [user, result])

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const fare = calcFare(rates, form.carType, form.distanceKm, form.tripType)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.pickupAddress || !form.dropAddress || !form.pickupTime)
      return setError('Name, email, pickup/drop address and pickup time are required.')
    if (form.tripType === 'round' && !form.returnTime)
      return setError('Please enter a return time for the round trip.')

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/cabs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
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
    <div className="page-wrapper bk-page">
      <div className="bk-banner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1400&fit=crop')" }}>
        <div className="bk-banner-overlay" />
        <div className="bk-banner-text">
          <h1>Book a <span>Cab</span></h1>
          <p>Auto, Mini, Sedan or SUV — ride anywhere</p>
        </div>
      </div>

      <div className="container bk-cab-layout">
        {!user ? (
          <LoginToBook what="book a cab" />
        ) : result ? (
          <div className="bk-success bk-panel">
            <div className="bk-success-check">✓</div>
            <h2>Cab Request Received!</h2>
            <div className="bk-summary">
              <div><span>From</span><strong>{result.pickupAddress}</strong></div>
              <div><span>To</span><strong>{result.dropAddress}</strong></div>
              <div><span>Car</span><strong>{rates[result.carType]?.label || result.carType}</strong></div>
              <div><span>Estimated fare</span><strong>₹{result.estimatedFare}</strong></div>
            </div>
            <p className="bk-muted">Driver name, phone and vehicle number will be shared once confirmed.</p>
            <button className="btn-primary" onClick={() => { setResult(null); setForm(emptyForm) }}>Book Another Cab</button>
          </div>
        ) : (
          <form className="bk-form bk-panel" onSubmit={handleSubmit}>
            <h2 className="bk-modal-title"><Car size={22} /> Cab Details</h2>

            <div className="bk-row">
              <div className="bk-field"><label>Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required /></div>
              <div className="bk-field"><label>Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
            </div>
            <div className="bk-field"><label>Email *</label>
              <input type="email" readOnly value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required /></div>

            <div className="bk-field"><label><MapPin size={13} /> Pickup address *</label>
              <input value={form.pickupAddress} onChange={e => set('pickupAddress', e.target.value)} placeholder="From where" required /></div>
            <div className="bk-field"><label><MapPin size={13} /> Drop address *</label>
              <input value={form.dropAddress} onChange={e => set('dropAddress', e.target.value)} placeholder="To where" required /></div>

            <div className="bk-tabs">
              <button type="button" className={form.tripType === 'pickup' ? 'active' : ''} onClick={() => set('tripType', 'pickup')}>One Way</button>
              <button type="button" className={form.tripType === 'round' ? 'active' : ''} onClick={() => set('tripType', 'round')}>Round Trip</button>
            </div>

            <div className="bk-row">
              <div className="bk-field"><label><Clock size={13} /> Pickup time *</label>
                <input type="datetime-local" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} required /></div>
              {form.tripType === 'round' && (
                <div className="bk-field"><label><Clock size={13} /> Return time *</label>
                  <input type="datetime-local" value={form.returnTime} onChange={e => set('returnTime', e.target.value)} required /></div>
              )}
            </div>

            <div className="bk-row">
              <div className="bk-field"><label><Users size={13} /> Passengers</label>
                <input type="number" min={1} max={8} value={form.passengers} onChange={e => set('passengers', e.target.value)} /></div>
              <div className="bk-field"><label><Route size={13} /> Approx distance (km)</label>
                <input type="number" min={1} max={500} value={form.distanceKm} onChange={e => set('distanceKm', e.target.value)} /></div>
            </div>

            <CarTypePicker rates={rates} value={form.carType} onChange={v => set('carType', v)}
              distanceKm={form.distanceKm} tripType={form.tripType} />

            <div className="bk-total">
              <span>Estimated fare {form.tripType === 'round' && '(round trip)'}</span>
              <strong>₹{fare}</strong>
            </div>

            {error && <div className="bk-error">{error}</div>}
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? <><Loader2 size={15} className="bk-spin" /> Booking…</> : 'Book Cab'}
            </button>
          </form>
        )}

        <aside className="bk-panel bk-tips">
          <h3>Going to the restaurant or a hotel?</h3>
          <p>While reserving a table or booking a hotel, tick <strong>"Need a cab too?"</strong> — the cab is linked to your booking and the timings are suggested automatically.</p>
          <Link to="/contact" className="btn-outline">Reserve a Table</Link>
          <Link to="/hotels" className="btn-outline">Book a Hotel</Link>
        </aside>
      </div>
    </div>
  )
}
