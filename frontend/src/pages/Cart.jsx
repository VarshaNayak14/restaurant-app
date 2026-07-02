import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE } from '../data/dishes.js'
import AvailableCoupons from '../components/AvailableCoupons.jsx'
import './Cart.css'

export default function Cart() {
  const { cart, updateQty, removeFromCart, total, count } = useCart()
  const { user } = useAuth()
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

  const freeDeliveryThreshold = deliverySettings.freeDeliveryThreshold
  const delivery = (deliverySettings.freeDeliveryEnabled && total >= freeDeliveryThreshold)
    ? 0
    : deliverySettings.deliveryFee
  const grand = total + delivery

  function handleCheckout() {
    if (!user) { navigate('/login'); return }
    navigate('/checkout')
  }

  if (cart.length === 0) return (
    <div className="page-wrapper cart-page">
      <div className="container">
        <div className="cart-empty">
          <ShoppingCart size={64} strokeWidth={1.2}/>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet. Explore our menu and add your favourites!</p>
          <Link to="/menu" className="btn-primary">Browse Menu </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Your <span>Cart</span></h1>
          <span className="cart-count-badge">{count} item{count!==1?'s':''}</span>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="item-img"/>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <span className="item-cat">{item.cat}</span>
                  <p className="item-desc">{item.desc}</p>
                </div>
                <div className="item-controls">
                  <div className="qty-row">
                    <button className="qty-btn" onClick={()=>updateQty(item.id, item.qty-1)}><Minus size={13}/></button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={()=>updateQty(item.id, item.qty+1)}><Plus size={13}/></button>
                  </div>
                  <div className="item-price">₹{item.price * item.qty}</div>
                  <button className="remove-btn" onClick={()=>removeFromCart(item.id)}><Trash2 size={15}/></button>
                </div>
              </div>
            ))}

            <AvailableCoupons boxed footerNote="Copy a code above, then apply it at checkout." />
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-rows">
              <div className="sum-row"><span>Subtotal ({count} items)</span><span>₹{total}</span></div>
              <div className="sum-row"><span>Delivery</span><span className={delivery===0?'free':''} >{delivery===0?'FREE':'₹'+delivery}</span></div>
            </div>
            {deliverySettings.freeDeliveryEnabled && total < freeDeliveryThreshold && (
              <div className="free-delivery-hint">
                Add ₹{freeDeliveryThreshold-total} more for <strong>FREE delivery</strong>
                <div className="fdh-bar"><div style={{width:`${(total/freeDeliveryThreshold)*100}%`}}/></div>
              </div>
            )}
            <div className="sum-total"><span>Total</span><span>₹{grand}</span></div>
            <button className="btn-primary checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout <ArrowRight size={15}/>
            </button>
            <Link to="/menu" className="continue-link">← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  )
}