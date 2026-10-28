import React, { useState, useEffect } from 'react'
import { MapPin, Phone, Mail, Clock, Send, ChevronDown, ChevronUp, Loader2, CheckCircle } from 'lucide-react'
import { API_BASE } from '../data/dishes.js'
import CabAddon, { emptyCab, validateCab, buildCabPayload, shiftDateTime } from '../components/CabAddon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Contact.css'

const faqs = [
  { q: 'What are your opening hours?', a: 'We are open every day from 11:00 AM to 11:00 PM. Walk-ins welcome; reservations recommended for groups of 4+.' },
  { q: 'Do you offer vegetarian & vegan options?', a: 'Absolutely! Over 50% of our menu is vegetarian. We can adapt several dishes for vegans — just ask your server.' },
  { q: 'How far do you deliver?', a: 'We deliver within a 10km radius. Delivery is FREE on orders above ₹499.' },
  { q: 'Can I book for large parties?', a: 'Yes! We accommodate groups up to 50. Contact us at least 48 hours in advance for the best experience.' },
  { q: 'Are the spice levels customisable?', a: 'Always! We offer mild, medium, and hot for every dish. Just mention your preference when ordering.' },
]

const emptyForm = { name: '', email: '', phone: '', guests: '2', date: '', message: '' }

export default function Contact() {
  const [form, setForm]       = useState(emptyForm)
  const [sent, setSent]       = useState(false)

  // ← NEW: logged-in user's name/email prefilled so the booking shows in Profile → My Bookings
  const { user, getToken } = useAuth()
  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }))
  }, [user, sent])
  const [open, setOpen]       = useState(null)
  const [info, setInfo]       = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')
  const [cab, setCab]               = useState(emptyCab)   // ← NEW: cab add-on
  const [cabResult, setCabResult]   = useState(null)
  const [cabError, setCabError]     = useState('')

  const restaurantAddress = info?.address || '42 Spice Lane, Bandra West, Mumbai'

  /* fetch contact info from backend */
  useEffect(() => {
    fetch(`${API_BASE}/contact/info`)
      .then(r => r.json())
      .then(d => { if (d.success) setInfo(d.data) })
      .catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name || !form.email || !form.date) {
      setFormError('Please fill in your name, email and preferred date.')
      return
    }
    const cabErr = validateCab(cab)
    if (cabErr) { setFormError(cabErr); return }
    setSubmitting(true)
    setCabResult(null)
    setCabError('')
    try {
      const res  = await fetch(`${API_BASE}/contact/reservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Submission failed')

      // ← NEW: table is booked — now book the cab (if requested) linked to this reservation
      if (cab.enabled) {
        try {
          const cabRes  = await fetch(`${API_BASE}/cabs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
            body: JSON.stringify({
              ...buildCabPayload(cab, restaurantAddress),
              name: form.name, email: form.email, phone: form.phone,
              reservationId: data.data._id,
              venueName: 'Hungry Hub Restaurant',
            }),
          })
          const cabData = await cabRes.json()
          if (!cabData.success) throw new Error(cabData.error || 'Cab booking failed')
          setCabResult(cabData.data)
        } catch (err) {
          setCabError(err.message || 'Cab booking failed')
        }
      }
      setSent(true)
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* info card data — dynamic from backend, fallback to defaults */
  const cards = [
    {
      icon: <MapPin size={22} />,
      title: 'Location',
      lines: [info?.address || '42 Spice Lane, Bandra West', 'Mumbai, MH 400050'],
    },
    {
      icon: <Phone size={22} />,
      title: 'Phone',
      lines: [info?.phone || '+91 98765 43210', info?.phone2].filter(Boolean),
    },
    {
      icon: <Mail size={22} />,
      title: 'Email',
      lines: [info?.email || 'hello@restaurant.com', info?.email2].filter(Boolean),
    },
    {
      icon: <Clock size={22} />,
      title: 'Opening Hours',
      lines: [info?.hours || 'Mon – Sun: 11am – 11pm', info?.hours2 || 'Kitchen closes at 10:30pm'],
    },
  ]

  return (
    <div className="page-wrapper contact-page">

      {/* Banner */}
      <div className="contact-banner">
        <div className="contact-banner-overlay" />
        <div className="contact-banner-text">
          <h1>Get in <span>Touch</span></h1>
          <p>Reserve a table, ask a question, or just say hello</p>
        </div>
      </div>

      <div className="container">

        {/* Info cards */}
        <div className="info-cards">
          {cards.map((c, i) => (
            <div key={i} className="info-card" style={{ animationDelay: `${i * 0.09}s` }}>
              <div className="info-icon">{c.icon}</div>
              <div>
                <h4>{c.title}</h4>
                {c.lines.map((l, j) => <p key={j}>{l}</p>)}
              </div>
            </div>
          ))}
        </div>

        {/* Form + Map */}
        <div className="contact-layout">
          {sent ? (
            <div className="sent-success">
              <div className="sent-check">✓</div>
              <h2>Request Received!</h2>
              <p>We'll confirm your reservation within 2 hours. A confirmation email has been sent to you. See you soon!</p>
              {cabResult && (
                <p>🚖 Your cab is booked too ({cabResult.carType}) — estimated fare <strong>₹{cabResult.estimatedFare}</strong>. Driver details will be shared once confirmed.</p>
              )}
              {cabError && (
                <p style={{ color: '#b91c1c' }}>Your table is booked, but the cab could not be booked: {cabError}. <a href="/cabs">Book a cab here</a>.</p>
              )}
              <button className="btn-primary" onClick={() => { setSent(false); setForm(emptyForm); setCab(emptyCab); setCabResult(null); setCabError('') }}>
                Make Another Reservation
              </button>
            </div>
          ) : (
            <div className="contact-form-wrap">
              <h2>Reserve a Table</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="cf-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    readOnly
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="cf-row">
                  <div className="form-group">
                    <label>Guests</label>
                    <select value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}>
                      {['1', '2', '3', '4', '5', '6', '7', '8+'].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Special Requests</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Allergies, occasion, seating preferences…"
                    rows={4}
                  />
                </div>
                {/* ← NEW: cab to and from the restaurant */}
                <CabAddon
                  cab={cab}
                  setCab={setCab}
                  venueName="Hungry Hub"
                  venueAddress={restaurantAddress}
                  suggestedPickup={shiftDateTime(form.date, -45)}
                  suggestedReturn={shiftDateTime(form.date, 120)}
                />
                {formError && (
                  <div style={{
                    background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5',
                    padding: '10px 14px', borderRadius: 8, fontSize: '.85rem'
                  }}>
                    {formError}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={submitting}
                >
                  {submitting
                    ? <><Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> Sending…</>
                    : <><Send size={15} /> Send Reservation Request</>}
                </button>
              </form>
            </div>
          )}

          {/* Map / restaurant image */}
          <div className="map-wrap">
            <div className="map-visual">
              {info?.mapEmbed ? (
                <iframe
                  src={info.mapEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: 12, minHeight: 280 }}
                  allowFullScreen
                  loading="lazy"
                  title="Restaurant Location"
                />
              ) : (
                <>
                  <img
                    src={info?.mapImg || 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&h=500&fit=crop&q=80'}
                    alt="restaurant"
                  />
                  <div className="map-pin-overlay">
                    <div className="map-pin-badge">
                      <MapPin size={14} /> {info?.mapLabel || 'Restaurant Location'}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="map-details">
              <h4>How to Find Us</h4>
              <p><strong>Address:</strong> {info?.address || '42 Spice Lane, Bandra West, Mumbai'}</p>
              <p><strong>Phone:</strong> {info?.phone || '+91 98765 43210'}</p>
              <p><strong>Hours:</strong> {info?.hours || 'Mon – Sun: 11am – 11pm'}</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="faq-section">
          <div className="section-header center" style={{ marginBottom: '40px' }}>
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title">Common <span>Questions</span></h2>
            <div className="gold-line center" />
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                  {f.q}
                  {open === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}