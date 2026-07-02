import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, MapPin, Clock, Package, Bike, Home, ArrowRight, Navigation } from 'lucide-react'
import './OrderConfirmation.css'

const STEPS = [
  { icon: <CheckCircle size={20}/>, label: 'Order Confirmed' },
  { icon: <Package size={20}/>,     label: 'Preparing Food'  },
  { icon: <Bike size={20}/>,        label: 'Out for Delivery' },
  { icon: <Home size={20}/>,        label: 'Delivered'        },
]

// Map backend status string → step index
const STATUS_TO_STEP = {
  confirmed:        0,
  preparing:        1,
  out_for_delivery: 2,
  delivered:        3,
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    color: ['#C9952A','#E63946','#27ae60','#3498db','#E8C060'][Math.floor(Math.random() * 5)],
    size: Math.random() * 10 + 6,
  }))
  return (
    <div className="confetti-wrap" aria-hidden>
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.x}%`, width: `${p.size}px`, height: `${p.size}px`,
          background: p.color, animationDelay: `${p.delay}s`,
        }}/>
      ))}
    </div>
  )
}

export default function OrderConfirmation() {
  const { state }             = useLocation()
  const navigate              = useNavigate()
  const order                 = state?.order
  const [stepIdx, setStepIdx] = useState(STATUS_TO_STEP[order?.status] ?? 0)

  useEffect(() => {
    if (stepIdx < 1) {
      const t = setTimeout(() => setStepIdx(1), 2000)
      return () => clearTimeout(t)
    }
  }, [stepIdx])

  if (!order) return (
    <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '120px' }}>
      <h2>No order found.</h2>
      <Link to="/menu" className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex', gap: '8px' }}>
        Browse Menu
      </Link>
    </div>
  )

  // Support both backend order shape and legacy shape
  const displayId = order.orderId || order.id || order._id

  return (
    <div className="page-wrapper oc-page">
      <Confetti/>
      <div className="container">

        {/* ── Hero ── */}
        <div className="oc-hero">
          <div className="oc-check-ring">
            <CheckCircle size={52} strokeWidth={1.5}/>
          </div>
          <h1>Order Placed!</h1>
          <p>Your delicious meal is on its way. Order ID: <strong>{displayId}</strong></p>
          <div className="oc-eta"><Clock size={15}/> Estimated delivery: 28–35 minutes</div>
        </div>

        {/* ── Tracker strip ── */}
        <div className="oc-tracker">
          <div className="oc-tracker-head">
            <h3>Live Tracking</h3>
            <button
              className="oc-track-btn"
              onClick={() => navigate('/order-tracking', { state: { order, stepIdx } })}
            >
              <Navigation size={14}/> Track Order
            </button>
          </div>
          <div className="tracker-steps">
            {STEPS.map((s, i) => (
              <div key={i} className={`tracker-step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}>
                <div className="ts-icon">{s.icon}</div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Layout ── */}
        <div className="oc-layout">

          {/* Items */}
          <div className="oc-items">
            <h3>Your Order</h3>
            {order.items.map((item, idx) => (
              <div key={item.id || idx} className="oc-item">
                <img src={item.image} alt={item.name}/>
                <div className="oci-info">
                  <span className="oci-name">{item.name}</span>
                  {item.desc && <span className="oci-desc">{item.desc}</span>}
                  <div className="oci-meta">
                    <span className="oci-tag">{item.cat}</span>
                    <span className="oci-qty">Qty: {item.qty}</span>
                  </div>
                </div>
                <span className="oci-price">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="oc-sidebar">
            <div className="oc-box">
              <h4><MapPin size={14}/> Delivery Address</h4>
              <p className="oc-addr-name">{order.address.name}</p>
              <p>{order.address.line1}</p>
              <p>{order.address.city} — PIN: {order.address.pin}</p>
            </div>

            <div className="oc-box">
              <h4>Bill Summary</h4>
              {order.couponCode && order.discount > 0 && (
                <div className="oc-total-row">
                  <span>Coupon ({order.couponCode})</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>− ₹{order.discount}</span>
                </div>
              )}
              <div className="oc-total-row">
                <span>Total Paid</span>
                <span className="oc-grand">₹{order.total}</span>
              </div>
              <div className="oc-total-row oc-pay-row">
                <span>Payment via</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{order.payment}</span>
              </div>
            </div>

            <button
              className="btn-primary oc-track-full"
              onClick={() => navigate('/order-tracking', { state: { order, stepIdx } })}
            >
              <Navigation size={15}/> Track Your Order
            </button>

            <Link to="/menu" className="btn-outline" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              Order Again <ArrowRight size={15}/>
            </Link>

            <Link to="/profile" className="continue-link">View All Orders</Link>
          </div>
        </div>

      </div>
    </div>
  )
}