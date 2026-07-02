const express  = require('express')
const crypto   = require('crypto')
const Order    = require('../models/Order')
const { protect } = require('../middleware/auth')
const { resolveCoupon, markCouponUsed } = require('../utils/couponHelper')

const router = express.Router()

/* ──────────────────────────────────────────────────────
   Lazily load Razorpay so the server starts fine even if
   the package isn't installed yet.
────────────────────────────────────────────────────── */
function getRazorpay() {
  try {
    const Razorpay = require('razorpay')
    return new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  } catch {
    throw new Error('Razorpay package not installed. Run: npm install razorpay')
  }
}

/* ──────────────────────────────────────────────────────
   POST /api/payments/razorpay/create-order
   Creates a Razorpay order; returns order id + key_id
────────────────────────────────────────────────────── */
router.post('/razorpay/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body                // amount in ₹
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, error: 'Invalid amount.' })
    }

    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),       // paise
      currency: 'INR',
      receipt:  'receipt_' + Date.now(),
    })

    res.json({
      success: true,
      key:     process.env.RAZORPAY_KEY_ID,
      order,
    })
  } catch (err) {
    console.error('Razorpay create-order error:', err)
    res.status(500).json({ success: false, error: err.message || 'Payment order creation failed.' })
  }
})

/* ──────────────────────────────────────────────────────
   POST /api/payments/razorpay/verify
   Verifies Razorpay signature → places the order in DB
────────────────────────────────────────────────────── */
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      /* order payload */
      items, address, payment, subtotal, delivery, tax, couponCode,
    } = req.body

    /* 1. Verify signature */
    const body      = razorpay_order_id + '|' + razorpay_payment_id
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed. Signature mismatch.' })
    }

    /* 2. Validate order payload */
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty.' })
    }
    if (!address || !address.name || !address.phone || !address.line1) {
      return res.status(400).json({ success: false, error: 'Delivery address is required.' })
    }

    /* 3. Coupon dobara validate karo (client se aaya total trust nahi karte) */
    let discount = 0
    let appliedCoupon = null
    if (couponCode) {
      const resolved = await resolveCoupon(couponCode, items, subtotal, req.user._id)
      if (resolved) {
        discount = resolved.discount
        appliedCoupon = resolved.coupon
      }
    }

    /* 4. Save order */
    const order = await Order.create({
      user:             req.user._id,
      userName:         req.user.name,
      userEmail:        req.user.email,
      items,
      address,
      payment,
      subtotal,
      delivery,
      tax,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discount,
      total: Math.max(0, subtotal + delivery + tax - discount),
      razorpayOrderId:  razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus:    'paid',
    })

    if (appliedCoupon) await markCouponUsed(appliedCoupon, req.user._id)

    res.status(201).json({ success: true, order })
  } catch (err) {
    console.error('Razorpay verify error:', err)
    res.status(500).json({ success: false, error: 'Could not place order after payment.' })
  }
})

module.exports = router