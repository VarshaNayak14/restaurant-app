import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { API_BASE } from '../data/dishes.js'
import { useAuth } from '../context/AuthContext.jsx'
import { toWords, money } from './Invoice.jsx'
import logo from '/logo.png'
import './Invoice.css'

const CAR  = { auto: 'Auto', mini: 'Mini', sedan: 'Sedan', suv: 'SUV' }
const TRIP = { pickup: 'Pickup (Home → Venue)', drop: 'Drop (Venue → Home)', round: 'Round trip' }

function fmt(str, withTime = true) {
  if (!str) return '—'
  const d = new Date(str)
  if (isNaN(d)) return str
  return d.toLocaleString('en-IN', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' })
}

// Short, readable bill number from the Mongo id, e.g. HB-5F3A9C21
const billNo = (prefix, id) => `${prefix}-${String(id).slice(-8).toUpperCase()}`

function cabLine(cab, idx) {
  return {
    idx,
    title: `Cab — ${CAR[cab.carType] || cab.carType}, ${TRIP[cab.tripType] || cab.tripType}`,
    sub: [
      `${cab.pickupAddress} → ${cab.dropAddress} (~${cab.distanceKm} km)`,
      cab.pickupTime && `Pickup: ${fmt(cab.pickupTime)}`,
      cab.returnTime && `Return: ${fmt(cab.returnTime)}`,
      cab.status === 'cancelled' && 'Cancelled — not charged',
    ].filter(Boolean),
    qty: 1,
    rate: cab.estimatedFare,
    amount: cab.status === 'cancelled' ? 0 : cab.estimatedFare,
  }
}

/* Bill for a hotel booking (with its cab) or a standalone / table cab */
export default function BookingInvoice() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, getToken } = useAuth()
  const [data, setData]   = useState(null)
  const [info, setInfo]   = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/contact/info`).then(r => r.json()).then(d => { if (d.success) setInfo(d.data) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    fetch(`${API_BASE}/my-bookings/bill/${type}/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); else setError(d.error || 'Bill not found.') })
      .catch(() => setError('Could not load the bill. Please try again.'))
  }, [type, id, user, authLoading, getToken])

  if (!authLoading && !user) return (
    <div className="inv-state">
      <p>Please log in to view your bill.</p>
      <Link to={`/login?redirect=${encodeURIComponent(`/booking-bill/${type}/${id}`)}`} className="btn-primary">Login</Link>
    </div>
  )
  if (error) return <div className="inv-state"><p>{error}</p><Link to="/profile?tab=bookings" className="btn-primary">My Bookings</Link></div>
  if (!data) return <div className="inv-state"><Loader2 size={24} className="inv-spin" /> Loading bill…</div>

  /* Build bill lines */
  const isHotel  = data.type === 'hotel'
  const main     = isHotel ? data.booking : data.cab
  const lines    = []
  if (isHotel) {
    const b = data.booking
    const rate = b.nights && b.rooms ? b.totalAmount / (b.nights * b.rooms) : b.totalAmount
    lines.push({
      idx: 1,
      title: `Room charges — ${b.hotelName}`,
      sub: [
        `${fmt(b.checkIn, false)} → ${fmt(b.checkOut, false)} · ${b.nights} night(s) × ${b.rooms} room(s)`,
        `${b.guests} guest(s)`,
        b.status === 'cancelled' && 'Cancelled — not charged',
      ].filter(Boolean),
      qty: b.nights * b.rooms,
      rate,
      amount: b.status === 'cancelled' ? 0 : b.totalAmount,
    })
    if (data.cab) lines.push(cabLine(data.cab, 2))
  } else {
    lines.push(cabLine(data.cab, 1))
  }
  const total     = lines.reduce((s, l) => s + l.amount, 0)
  const hasCab    = isHotel ? !!data.cab : true
  const number    = billNo(isHotel ? 'HB' : 'CB', main._id)
  const created   = new Date(main.createdAt)
  const cab       = data.cab

  return (
    <div className="inv-page">
      <div className="inv-toolbar">
        <button className="inv-btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <button className="inv-btn inv-btn-gold" onClick={() => window.print()}><Printer size={16} /> Download / Print Bill</button>
      </div>
      <p className="inv-hint">Tip: choose <strong>"Save as PDF"</strong> in the print dialog to download the bill.</p>

      <div className="inv-sheet">
        <div className="inv-head">
          <div className="inv-brand">
            <img src={logo} alt="HungryHub" />
            <div>
              <h1>Hungry<span>Hub</span></h1>
              <p>{info?.address || '42 Spice Lane, Bandra West'}{info?.city ? `, ${info.city}` : ''}</p>
              <p>{info?.phone || '+91 98765 43210'} · {info?.email || 'hello@restaurant.com'}</p>
            </div>
          </div>
          <h2 className="inv-title">INVOICE</h2>
        </div>

        <div className="inv-meta">
          <div><span>Invoice No.</span><strong>{number}</strong></div>
          <div><span>Date</span><strong>{created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
          <div><span>Type</span><strong>{isHotel ? (data.cab ? 'Hotel + Cab Booking' : 'Hotel Booking') : main.linkedType === 'restaurant' ? 'Cab (Table Reservation)' : 'Cab Booking'}</strong></div>
          <div><span>Status</span><strong style={{ textTransform: 'capitalize' }}>{main.status}</strong></div>
        </div>

        <div className="inv-parties">
          <div>
            <h4>Bill To</h4>
            <p className="inv-strong">{main.name}</p>
            <p>Email: {main.email}</p>
            {main.phone && <p>Phone: {main.phone}</p>}
          </div>
          <div>
            <h4>{isHotel ? 'Stay Details' : 'Trip Details'}</h4>
            {isHotel ? (
              <>
                <p className="inv-strong">{data.booking.hotelName}</p>
                {data.booking.hotel?.address && <p>{data.booking.hotel.address}{data.booking.hotel.city ? `, ${data.booking.hotel.city}` : ''}</p>}
                <p>Check-in: {fmt(data.booking.checkIn, false)}</p>
                <p>Check-out: {fmt(data.booking.checkOut, false)}</p>
              </>
            ) : (
              <>
                <p className="inv-strong">{CAR[cab.carType]} · {TRIP[cab.tripType]}</p>
                {cab.venueName && <p>For: {cab.venueName}</p>}
                <p>{cab.passengers} passenger(s)</p>
              </>
            )}
            {cab?.driverName && <p>Driver: {cab.driverName}{cab.driverPhone ? ` (${cab.driverPhone})` : ''}{cab.vehicleNumber ? ` · ${cab.vehicleNumber}` : ''}</p>}
          </div>
        </div>

        <table className="inv-items">
          <thead>
            <tr><th>#</th><th>Description</th><th className="r">Qty</th><th className="r">Rate</th><th className="r">Amount</th></tr>
          </thead>
          <tbody>
            {lines.map(l => (
              <tr key={l.idx}>
                <td>{l.idx}</td>
                <td>{l.title}{l.sub.map((s, i) => <span key={i} className="inv-cat">{s}</span>)}</td>
                <td className="r">{l.qty}</td>
                <td className="r">{money(l.rate)}</td>
                <td className="r">{money(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-bottom">
          <div className="inv-words">
            <h4>Amount in words</h4>
            <p>Rupees {toWords(total)} Only</p>
            <p className="inv-small" style={{ marginTop: 8 }}>Payment: to be paid at {isHotel ? 'the hotel / to the driver' : 'the end of the ride'}.</p>
          </div>
          <table className="inv-totals">
            <tbody>
              {lines.map(l => <tr key={l.idx}><td>{l.idx === 1 && isHotel ? 'Hotel' : 'Cab'}</td><td>{money(l.amount)}</td></tr>)}
              <tr className="inv-grand"><td>Grand Total</td><td>{money(total)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="inv-foot">
          <p>Thank you for booking with <strong>HungryHub</strong>!</p>
          {hasCab && <p className="inv-small">Cab fare is an estimate; the final fare depends on the actual distance travelled.</p>}
          <p className="inv-small">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  )
}
