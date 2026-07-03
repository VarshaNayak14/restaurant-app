import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, Wallet, Smartphone, Check, ArrowRight, Tag, X, Loader2, BadgeCheck } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { validateCoupon } from '../data/coupons.js'
import { API_BASE } from '../data/dishes.js'
import AvailableCoupons from '../components/AvailableCoupons.jsx'
import './Checkout.css'

const API   = 'https://restaurant-app-1-4jis.onrender.com/api'
const STEPS = ['Delivery', 'Payment', 'Confirm']

/* ─── load Razorpay script once ─── */
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
}

/* ══════════════════════════════════════════════════════
   Sub-forms — defined OUTSIDE Checkout so they never
   remount on parent state change (fixes focus loss bug)
══════════════════════════════════════════════════════ */
function CardForm({ cardNum, setCardNum, cardName, setCardName, cardExp, setCardExp, cardCvv, setCardCvv }) {
  return (
    <div className="payment-form">
      <div className="pf-group full">
        <label>Card Number</label>
        <input
          type="text"
          maxLength={19}
          placeholder="1234 5678 9012 3456"
          value={cardNum}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 16)
            setCardNum(v.replace(/(.{4})/g, '$1 ').trim())
          }}
        />
      </div>
      <div className="pf-group full">
        <label>Name on Card</label>
        <input
          type="text"
          placeholder="As printed on card"
          value={cardName}
          onChange={e => setCardName(e.target.value)}
        />
      </div>
      <div className="pf-group">
        <label>Expiry</label>
        <input
          type="text"
          maxLength={5}
          placeholder="MM/YY"
          value={cardExp}
          onChange={e => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 4)
            if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
            setCardExp(v)
          }}
        />
      </div>
      <div className="pf-group">
        <label>CVV</label>
        <input
          type="password"
          maxLength={4}
          placeholder="•••"
          value={cardCvv}
          onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </div>
      <p className="pay-note">🔒 Your card details are secured via Razorpay — we never store them.</p>
    </div>
  )
}

function UpiForm({ upiId, setUpiId }) {
  return (
    <div className="payment-form">
      <div className="pf-group full">
        <label>UPI ID</label>
        <input
          type="text"
          placeholder="yourname@upi"
          value={upiId}
          onChange={e => setUpiId(e.target.value)}
        />
      </div>
      <p className="pay-note">💡 Enter your UPI ID (e.g. 9876543210@paytm). Razorpay will send a collect request.</p>
    </div>
  )
}

function WalletForm({ wallet, setWallet }) {
  const wallets = [
    { id: 'paytm',     label: 'Paytm',       logo: '🔵' },
    { id: 'phonepe',   label: 'PhonePe',     logo: '🟣' },
    { id: 'amazonpay', label: 'Amazon Pay',  logo: '🟡' },
    { id: 'freecharge',label: 'FreeCharge',  logo: '🟢' },
  ]
  return (
    <div className="payment-form">
      <div className="wallet-grid">
        {wallets.map(w => (
          <label key={w.id} className={`wallet-chip ${wallet === w.id ? 'selected' : ''}`}>
            <input
              type="radio"
              name="wallet"
              value={w.id}
              checked={wallet === w.id}
              onChange={() => setWallet(w.id)}
            />
            <span>{w.logo} {w.label}</span>
          </label>
        ))}
      </div>
      <p className="pay-note">💡 You will be redirected to your wallet app to complete payment via Razorpay.</p>
    </div>
  )
}

function CodInfo({ grand }) {
  return (
    <div className="payment-form">
      <div className="cod-box">
        <span className="cod-icon">💵</span>
        <div>
          <strong>Pay when your order arrives</strong>
          <p>Keep exact change of <strong>₹{grand}</strong> ready for the delivery partner.</p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Main Checkout component
══════════════════════════════════════════════════════ */
export default function Checkout() {
  const [step, setStep]       = useState(0)
  const [addr, setAddr]       = useState({ name: '', phone: '', line1: '', city: '', pin: '' })
  const [pay,  setPay]        = useState('card')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  /* Card fields */
  const [cardNum,  setCardNum]  = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExp,  setCardExp]  = useState('')
  const [cardCvv,  setCardCvv]  = useState('')

  /* UPI */
  const [upiId, setUpiId] = useState('')

  /* Wallet */
  const [wallet, setWallet] = useState('paytm')

  /* Coupon */
  const [couponInput, setCouponInput]     = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null) // { code, discount, description }
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError]     = useState('')

  const { cart, total, clearCart } = useCart()
  const { user, getToken }         = useAuth()
  const navigate = useNavigate()

  /* ── Delivery charge — admin-controlled ── */
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryFee: 49, freeDeliveryThreshold: 499, freeDeliveryEnabled: true,
  })
  useEffect(() => {
    fetch(`${API_BASE}/delivery-settings`)
      .then(r => r.json())
      .then(d => { if (d.success) setDeliverySettings(d.data) })
      .catch(() => {})
  }, [])

  const delivery = (deliverySettings.freeDeliveryEnabled && total >= deliverySettings.freeDeliveryThreshold)
    ? 0
    : deliverySettings.deliveryFee
  const discount = appliedCoupon?.discount || 0
  const grand    = Math.max(0, total + delivery - discount)

  async function handleApplyCoupon() {
    if (!couponInput.trim()) { setCouponError('Please enter a coupon code.'); return }
    setCouponLoading(true)
    setCouponError('')
    try {
      const data = await validateCoupon(couponInput.trim(), cart, total, getToken())
      setAppliedCoupon({
        code: data.coupon.code,
        discount: data.discount,
        description: data.coupon.description,
        dishSpecific: data.coupon.dishSpecific,
      })
      setCouponError('')
    } catch (err) {
      setAppliedCoupon(null)
      setCouponError(err.message || 'Invalid coupon code.')
    } finally {
      setCouponLoading(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  /* ── Razorpay flow ── */
  async function handleRazorpay() {
    setLoading(true)
    setError('')

    const loaded = await loadRazorpay()
    if (!loaded) {
      setError('Razorpay SDK load failed. Check internet connection.')
      setLoading(false)
      return
    }

    try {
      const orderRes = await fetch(`${API}/payments/razorpay/create-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ amount: grand }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.error || 'Could not create payment order')

      const options = {
        key:         orderData.key,
        amount:      orderData.order.amount,
        currency:    orderData.order.currency,
        name:        'HungryHub',
        description: 'Food Order Payment',
        order_id:    orderData.order.id,
        prefill:     { name: addr.name, contact: addr.phone, email: user?.email || '' },
        theme:       { color: '#c9952a' },
        handler: async function (response) {
          await verifyAndPlace(response)
        },
        modal: {
          ondismiss: () => { setError('Payment cancelled.'); setLoading(false) },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err.message || 'Payment initiation failed.')
      setLoading(false)
    }
  }

  async function verifyAndPlace(razorpayResponse) {
    try {
      const res = await fetch(`${API}/payments/razorpay/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          razorpay_order_id:   razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature:  razorpayResponse.razorpay_signature,
          items: cart, address: addr, payment: pay,
          subtotal: total, delivery, tax: 0,
          couponCode: appliedCoupon?.code || null,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Payment verification failed')
      clearCart()
      navigate('/order-confirmation', { state: { order: data.order } })
    } catch (err) {
      setError(err.message || 'Order could not be placed after payment.')
      setLoading(false)
    }
  }

  async function placeOrder() {
    if (pay !== 'cod') { await handleRazorpay(); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/orders`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          items: cart, address: addr, payment: pay,
          subtotal: total, delivery, tax: 0,
          couponCode: appliedCoupon?.code || null,
        }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Order failed. Please try again.'); setLoading(false); return }
      clearCart()
      navigate('/order-confirmation', { state: { order: data.order } })
    } catch {
      setError('Cannot connect to server. Please check your connection.')
      setLoading(false)
    }
  }

  /* ── Render ── */
  return (
    <div className="page-wrapper checkout-page" style={{ marginTop: '30px' }}>
      <div className="container">

        {/* Stepper */}
        <div className="checkout-stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`step ${i <= step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
              <div className="step-circle">{i < step ? <Check size={14} /> : i + 1}</div>
              <span>{s}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">

            {/* Step 0 – Delivery */}
            {step === 0 && (
              <div className="checkout-section">
                <h2><MapPin size={20} /> Delivery Address</h2>
                <div className="addr-form">
                  {[
                    ['Name',    'name',  'Full name'],
                    ['Phone',   'phone', 'Mobile number'],
                    ['Address', 'line1', 'Street address'],
                    ['City',    'city',  'City'],
                    ['PIN',     'pin',   'PIN code'],
                  ].map(([label, key, ph]) => (
                    <div key={key} className={`form-group ${key === 'line1' ? 'full' : ''}`}>
                      <label>{label}</label>
                      <input
                        value={addr[key]}
                        onChange={e => setAddr(a => ({ ...a, [key]: e.target.value }))}
                        placeholder={ph}
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setStep(1)}
                  disabled={!addr.name || !addr.phone || !addr.line1}
                >
                  Continue to Payment <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* Step 1 – Payment */}
            {step === 1 && (
              <div className="checkout-section">
                <h2><CreditCard size={20} /> Payment Method</h2>

                <div className="pay-options">
                  {[
                    { id: 'card',   icon: <CreditCard size={18} />, label: 'Credit / Debit Card' },
                    { id: 'upi',    icon: <Smartphone size={18} />, label: 'UPI / QR Code' },
                    { id: 'wallet', icon: <Wallet size={18} />,     label: 'Mobile Wallet' },
                    { id: 'cod',    icon: <MapPin size={18} />,     label: 'Cash on Delivery' },
                  ].map(o => (
                    <label key={o.id} className={`pay-option ${pay === o.id ? 'selected' : ''}`}>
                      <input type="radio" name="pay" value={o.id} checked={pay === o.id} onChange={() => setPay(o.id)} />
                      <span className="pay-icon">{o.icon}</span>
                      <span>{o.label}</span>
                      {o.id !== 'cod' && <span className="rzp-badge">via Razorpay 🔒</span>}
                    </label>
                  ))}
                </div>

                {/* Payment sub-forms — components defined outside, so no remount */}
                <div className="pay-subform">
                  {pay === 'card' && (
                    <CardForm
                      cardNum={cardNum}   setCardNum={setCardNum}
                      cardName={cardName} setCardName={setCardName}
                      cardExp={cardExp}   setCardExp={setCardExp}
                      cardCvv={cardCvv}   setCardCvv={setCardCvv}
                    />
                  )}
                  {pay === 'upi'    && <UpiForm    upiId={upiId}   setUpiId={setUpiId} />}
                  {pay === 'wallet' && <WalletForm wallet={wallet} setWallet={setWallet} />}
                  {pay === 'cod'    && <CodInfo    grand={grand} />}
                </div>

                <div className="step-btns">
                  <button className="btn-outline" onClick={() => setStep(0)}>← Back</button>
                  <button className="btn-primary" onClick={() => setStep(2)}>
                    Review Order <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 – Confirm */}
            {step === 2 && (
              <div className="checkout-section">
                <h2><Check size={20} /> Review &amp; Confirm</h2>
                <div className="review-block">
                  <h4>Delivery to</h4>
                  <p>{addr.name} · {addr.phone}</p>
                  <p>{addr.line1}, {addr.city} - {addr.pin}</p>
                </div>
                <div className="review-block">
                  <h4>Payment via</h4>
                  <p>
                    {pay === 'card'   && 'Credit / Debit Card (Razorpay)'}
                    {pay === 'upi'    && `UPI — ${upiId || 'N/A'} (Razorpay)`}
                    {pay === 'wallet' && `${wallet.charAt(0).toUpperCase() + wallet.slice(1)} Wallet (Razorpay)`}
                    {pay === 'cod'    && 'Cash on Delivery'}
                  </p>
                </div>
                <div className="review-items">
                  {cart.map(i => (
                    <div key={i.id} className="review-item">
                      <img src={i.image} alt={i.name} />
                      <span>{i.name} × {i.qty}</span>
                      <span>₹{i.price * i.qty}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div style={{
                    background: '#fee2e2', color: '#991b1b',
                    padding: '10px 14px', borderRadius: '8px',
                    marginBottom: '14px', fontSize: '0.9rem',
                  }}>
                    ⚠ {error}
                  </div>
                )}

                <div className="step-btns">
                  <button className="btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={placeOrder} disabled={loading}>
                    {loading
                      ? <><span className="spinner" /> {pay === 'cod' ? 'Placing order…' : 'Opening payment…'}</>
                      : pay === 'cod'
                        ? <>Place Order ₹{grand}</>
                        : <>Pay ₹{grand} via Razorpay &nbsp;🔒</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="co-summary">
            <h3>Order Summary</h3>
            {cart.map(i => (
              <div key={i.id} className="cos-item">
                <img src={i.image} alt={i.name} />
                <span className="cos-name">{i.name}</span>
                <span className="cos-qty">×{i.qty}</span>
                <span className="cos-price">₹{i.price * i.qty}</span>
              </div>
            ))}
            {/* ── Coupon code ── */}
            <div className="cos-coupon">
              {!appliedCoupon ? (
                <>
                  <AvailableCoupons title="Available Offers" compact />
                  <div className="cos-coupon-row">
                    <Tag size={15} className="cos-coupon-icon" />
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <button
                      type="button"
                      className="cos-coupon-apply"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? <Loader2 size={14} className="spin-icon" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="cos-coupon-error">{couponError}</p>}
                </>
              ) : (
                <div className="cos-coupon-applied">
                  <span className="cos-coupon-applied-info">
                    <BadgeCheck size={15} />
                    <span>
                      <strong>{appliedCoupon.code}</strong> applied{appliedCoupon.description ? ` — ${appliedCoupon.description}` : ''}
                      {appliedCoupon.dishSpecific && <em style={{ display: 'block', fontStyle: 'normal', fontSize: '.72rem', opacity: .8 }}>Applies to select item(s) in your cart</em>}
                    </span>
                  </span>
                  <button type="button" className="cos-coupon-remove" onClick={handleRemoveCoupon} title="Remove coupon">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="cos-totals">
              <div className="cos-row"><span>Subtotal</span><span>₹{total}</span></div>
              <div className="cos-row"><span>Delivery</span><span>{delivery === 0 ? 'FREE' : '₹' + delivery}</span></div>
              {discount > 0 && (
                <div className="cos-row cos-discount-row"><span>Coupon Discount</span><span>− ₹{discount}</span></div>
              )}
              <div className="cos-grand"><span>Total</span><span>₹{grand}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}