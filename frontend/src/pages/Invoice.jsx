import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { API_BASE } from '../data/dishes.js'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '/logo.png'
import './Invoice.css'

const PAYMENT_LABEL = { cod: 'Cash on Delivery', card: 'Card', upi: 'UPI', wallet: 'Wallet' }

/* Number → Indian-English words, e.g. 1250 → "One Thousand Two Hundred Fifty" */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
function twoDigits(n) { return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]} ${ONES[n % 10]}`.trim() }
function threeDigits(n) {
  const h = Math.floor(n / 100), r = n % 100
  return [h ? `${ONES[h]} Hundred` : '', r ? twoDigits(r) : ''].filter(Boolean).join(' ')
}
export function toWords(num) {
  num = Math.round(Number(num) || 0)
  if (num === 0) return 'Zero'
  const parts = []
  const crore = Math.floor(num / 10000000); num %= 10000000
  const lakh  = Math.floor(num / 100000);   num %= 100000
  const thou  = Math.floor(num / 1000);     num %= 1000
  if (crore) parts.push(`${threeDigits(crore)} Crore`)
  if (lakh)  parts.push(`${twoDigits(lakh)} Lakh`)
  if (thou)  parts.push(`${twoDigits(thou)} Thousand`)
  if (num)   parts.push(threeDigits(num))
  return parts.join(' ')
}

export const money = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Invoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, getToken } = useAuth()
  const [order, setOrder] = useState(null)
  const [info, setInfo]   = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/contact/info`).then(r => r.json()).then(d => { if (d.success) setInfo(d.data) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    fetch(`${API_BASE}/orders/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrder(d.order); else setError(d.error || 'Bill not found.') })
      .catch(() => setError('Could not load the bill. Please try again.'))
  }, [id, user, authLoading, getToken])

  if (!authLoading && !user) return (
    <div className="inv-state">
      <p>Please log in to view your bill.</p>
      <Link to={`/login?redirect=${encodeURIComponent(`/invoice/${id}`)}`} className="btn-primary">Login</Link>
    </div>
  )
  if (error) return <div className="inv-state"><p>{error}</p><Link to="/profile" className="btn-primary">My Orders</Link></div>
  if (!order) return <div className="inv-state"><Loader2 size={24} className="inv-spin" /> Loading bill…</div>

  const date = new Date(order.createdAt)
  const paid = order.payment !== 'cod' && order.paymentStatus === 'paid'

  return (
    <div className="inv-page">
      {/* Toolbar — hidden when printing */}
      <div className="inv-toolbar">
        <button className="inv-btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <button className="inv-btn inv-btn-gold" onClick={() => window.print()}><Printer size={16} /> Download / Print Bill</button>
      </div>
      <p className="inv-hint">Tip: choose <strong>"Save as PDF"</strong> in the print dialog to download the bill.</p>

      <div className="inv-sheet">
        {/* Header */}
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

        {/* Invoice meta — left aligned strip */}
        <div className="inv-meta">
          <div><span>Invoice No.</span><strong>{order.orderId}</strong></div>
          <div><span>Date</span><strong>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
          <div><span>Time</span><strong>{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></div>
        </div>

        {/* Bill to / payment */}
        <div className="inv-parties">
          <div>
            <h4>Bill To</h4>
            <p className="inv-strong">{order.address?.name || order.userName}</p>
            <p>{order.address?.line1}</p>
            <p>{order.address?.city}{order.address?.pin ? ` — ${order.address.pin}` : ''}</p>
            <p>Phone: {order.address?.phone}</p>
            {order.userEmail && <p>Email: {order.userEmail}</p>}
          </div>
          <div>
            <h4>Payment</h4>
            <p className="inv-strong">{PAYMENT_LABEL[order.payment] || order.payment}</p>
            <p>Status: <span className={`inv-pay ${paid ? 'paid' : ''}`}>{paid ? 'PAID' : order.payment === 'cod' ? 'Pay on delivery' : (order.paymentStatus || 'pending').toUpperCase()}</span></p>
            {order.razorpayPaymentId && <p>Txn ID: {order.razorpayPaymentId}</p>}
            <p>Order status: {String(order.status).replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Items */}
        <table className="inv-items">
          <thead>
            <tr><th>#</th><th>Item</th><th className="r">Qty</th><th className="r">Rate</th><th className="r">Amount</th></tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{it.name}{it.cat && <span className="inv-cat">{it.cat}</span>}</td>
                <td className="r">{it.qty}</td>
                <td className="r">{money(it.price)}</td>
                <td className="r">{money(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="inv-bottom">
          <div className="inv-words">
            <h4>Amount in words</h4>
            <p>Rupees {toWords(order.total)} Only</p>
          </div>
          <table className="inv-totals">
            <tbody>
              <tr><td>Subtotal</td><td>{money(order.subtotal)}</td></tr>
              <tr><td>Delivery charges</td><td>{order.delivery ? money(order.delivery) : 'FREE'}</td></tr>
              {order.tax > 0 && <tr><td>Tax</td><td>{money(order.tax)}</td></tr>}
              {order.discount > 0 && <tr className="inv-disc"><td>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</td><td>− {money(order.discount)}</td></tr>}
              <tr className="inv-grand"><td>Grand Total</td><td>{money(order.total)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="inv-foot">
          <p>Thank you for ordering from <strong>HungryHub</strong>! We hope you enjoyed your meal.</p>
          <p className="inv-small">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  )
}
