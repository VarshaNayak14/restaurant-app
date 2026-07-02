import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle, Package, Bike, Home, Clock, MapPin,
  Phone, ArrowLeft, ChefHat, Flame, Star
} from 'lucide-react'
import './OrderTracking.css'

const STEPS = [
  {
    icon: <CheckCircle size={22}/>,
    label: 'Order Confirmed',
    sub: 'We received your order',
    time: '0 min',
  },
  {
    icon: <ChefHat size={22}/>,
    label: 'Preparing Food',
    sub: 'Our chefs are cooking',
    time: '~10 min',
  },
  {
    icon: <Bike size={22}/>,
    label: 'Out for Delivery',
    sub: 'Rider is on the way',
    time: '~20 min',
  },
  {
    icon: <Home size={22}/>,
    label: 'Delivered',
    sub: 'Enjoy your meal!',
    time: '~35 min',
  },
]

const RIDER = {
  name: 'Rahul Kumar',
  phone: '+91 98765 43210',
  rating: '4.9',
  trips: '1,240',
  avatar: 'RK',
}

export default function OrderTracking() {
  const { state }             = useLocation()
  const navigate              = useNavigate()
  const order                 = state?.order
  const [stepIdx, setStepIdx] = useState(state?.stepIdx ?? 0)
  const [eta, setEta]         = useState(35)
  const [dots, setDots]       = useState('.')

  // Auto-advance steps every 8s for demo
  useEffect(() => {
    if (stepIdx >= STEPS.length - 1) return
    const t = setTimeout(() => setStepIdx(s => Math.min(s + 1, STEPS.length - 1)), 8000)
    return () => clearTimeout(t)
  }, [stepIdx])

  // ETA countdown
  useEffect(() => {
    if (eta <= 0) return
    const t = setInterval(() => setEta(e => Math.max(0, e - 1)), 60000)
    return () => clearInterval(t)
  }, [eta])

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(t)
  }, [])

  // Guard: no order in state at all -> show fallback (existing behavior)
  if (!order) return (
    <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '140px' }}>
      <h2>No active order found.</h2>
      <Link to="/menu" className="btn-primary" style={{ marginTop: 20, display: 'inline-flex', gap: 8 }}>
        Browse Menu
      </Link>
    </div>
  )

  const currentStep = STEPS[stepIdx]

  // Safely derive an order id from whatever key is actually present
  // (handles order.id, order._id, order.orderId, etc.) so we never
  // call .slice() on undefined again.
  const rawOrderId   = order.id ?? order._id ?? order.orderId ?? ''
  const orderIdStr    = String(rawOrderId)
  const shortOrderId  = orderIdStr ? orderIdStr.slice(-8) : 'N/A'

  // Safe fallbacks for other fields that might be missing
  const orderDate    = order.date ? new Date(order.date) : null
  const orderAddress = order.address ?? {}
  const orderItems   = order.items ?? []
  const orderTotal   = order.total ?? 0

  return (
    <div className="page-wrapper ot-page" style={{marginTop:"20px"}}>
      <div className="container">

        {/* Back */}
        <button className="ot-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16}/> Back to Order
        </button>

        {/* ── Header ── */}
        <div className="ot-header">
          <div className="ot-header-left">
            <span className="ot-eyebrow">Live Tracking</span>
            <h1>Order <span>#{shortOrderId}</span></h1>

            <p>
              {orderDate
                ? `Placed on ${orderDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                : 'Order date unavailable'}
            </p>
          </div>
          <div className="ot-eta-box">
            <Clock size={18}/>
            <div>
              <span className="ot-eta-val">{eta} min</span>
              <span className="ot-eta-label">Est. Arrival</span>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="ot-grid">

          {/* Left col */}
          <div className="ot-left">

            {/* Status card */}
            <div className="ot-status-card">
              <div className="ot-status-icon">
                {currentStep.icon}
              </div>
              <div className="ot-status-text">
                <h2>{currentStep.label}</h2>
                <p>{currentStep.sub}{stepIdx < STEPS.length - 1 ? dots : ''}</p>
              </div>
              <div className={`ot-pulse-ring ${stepIdx < STEPS.length - 1 ? 'active' : 'done'}`}/>
            </div>

            {/* Progress steps */}
            <div className="ot-steps-card">
              {STEPS.map((s, i) => (
                <div key={i} className={`ot-step ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''} ${i > stepIdx ? 'pending' : ''}`}>
                  <div className="ot-step-left">
                    <div className="ot-step-icon">{s.icon}</div>
                    {i < STEPS.length - 1 && <div className="ot-step-line"/>}
                  </div>
                  <div className="ot-step-body">
                    <span className="ot-step-label">{s.label}</span>
                    <span className="ot-step-sub">{s.sub}</span>
                  </div>
                  <span className="ot-step-time">{i <= stepIdx ? (i === 0 ? 'Done' : i < stepIdx ? 'Done' : 'Now') : s.time}</span>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="ot-map">
              <div className="ot-map-inner">
                <div className="ot-map-road ot-map-road-h"/>
                <div className="ot-map-road ot-map-road-v"/>
                <div className="ot-map-road ot-map-road-h2"/>
                <div className="ot-map-road ot-map-road-v2"/>
                {/* Restaurant pin */}
                <div className="ot-pin ot-pin-rest" style={{ top: '30%', left: '22%' }}>
                  <Flame size={14}/>
                  <span>Restaurant</span>
                </div>
                {/* Rider dot */}
                {stepIdx >= 2 && (
                  <div className="ot-rider-dot" style={{ top: '52%', left: '54%' }}>
                    <Bike size={13}/>
                  </div>
                )}
                {/* Home pin */}
                <div className="ot-pin ot-pin-home" style={{ bottom: '20%', right: '18%' }}>
                  <Home size={14}/>
                  <span>You</span>
                </div>
                <div className="ot-map-label">Live map preview</div>
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="ot-right">

            {/* Rider card */}
            {stepIdx >= 2 && (
              <div className="ot-rider-card">
                <h4>Your Delivery Rider</h4>
                <div className="ot-rider-info">
                  <div className="ot-rider-av">{RIDER.avatar}</div>
                  <div className="ot-rider-details">
                    <span className="ot-rider-name">{RIDER.name}</span>
                    <span className="ot-rider-stats"><Star size={12} fill="currentColor" style={{color:'#f59e0b', verticalAlign:'-2px'}} /> {RIDER.rating} · {RIDER.trips} trips</span>
                  </div>
                  <a href={`tel:${RIDER.phone}`} className="ot-call-btn">
                    <Phone size={16}/>
                  </a>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="ot-info-card">
              <h4><MapPin size={14}/> Delivery Address</h4>
              <p className="ot-addr-name">{orderAddress.name ?? '—'}</p>
              <p>{orderAddress.line1 ?? '—'}</p>
              <p>{(orderAddress.city ?? '—')} — PIN: {orderAddress.pin ?? '—'}</p>
            </div>

            {/* Order items */}
            <div className="ot-info-card">
              <h4><Package size={14}/> Order Items</h4>
              <div className="ot-item-list">
                {orderItems.map(item => (
                  <div key={item.id} className="ot-item">
                    <img src={item.image} alt={item.name}/>
                    <div className="ot-item-info">
                      <span className="ot-item-name">{item.name}</span>
                      <span className="ot-item-desc">{item.desc}</span>
                      <span className="ot-item-qty">Qty: {item.qty}</span>
                    </div>
                    <span className="ot-item-price">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="ot-bill-row">
                <span>Total Paid</span>
                <span className="ot-bill-total">₹{orderTotal}</span>
              </div>
            </div>

            {/* Help */}
            <div className="ot-help-card">
              <span>Need help with your order?</span>
              <Link to="/contact" className="ot-help-btn">Contact Support</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}