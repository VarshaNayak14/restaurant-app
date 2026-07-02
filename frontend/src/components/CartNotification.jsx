import React from 'react'
import { CheckCircle } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import './CartNotification.css'

export default function CartNotification() {
  const { notification } = useCart()
  return (
    <div className={`cart-notif ${notification ? 'show' : ''}`}>
      <CheckCircle size={18} className="notif-icon" />
      <span><strong>{notification}</strong> added to cart!</span>
    </div>
  )
}
