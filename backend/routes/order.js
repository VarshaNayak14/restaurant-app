const express  = require('express')
const Order    = require('../models/Order')
const { protect, adminOnly } = require('../middleware/auth')
const { resolveCoupon, markCouponUsed } = require('../utils/couponHelper')

const router = express.Router()

// ─────────────────────────────────────────────────────────
//  USER ROUTES
// ─────────────────────────────────────────────────────────

/**
 * POST /api/orders
 * Place a new order (logged-in users only)
 * Body: { items, address, payment, subtotal, delivery, tax, total }
 */
router.post('/', protect, async (req, res) => {
  try {
    const { items, address, payment, subtotal, delivery, tax, couponCode } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty.' })
    }
    if (!address || !address.name || !address.phone || !address.line1) {
      return res.status(400).json({ success: false, error: 'Delivery address is required.' })
    }
    if (!payment) {
      return res.status(400).json({ success: false, error: 'Payment method is required.' })
    }

    // Coupon ko yahan server-side dobara validate karo — client se
    // bheja hua discount blindly trust nahi karte.
    let discount = 0
    let appliedCoupon = null
    if (couponCode) {
      const resolved = await resolveCoupon(couponCode, items, subtotal, req.user._id)
      if (resolved) {
        discount = resolved.discount
        appliedCoupon = resolved.coupon
      }
    }

    const order = await Order.create({
      user:      req.user._id,
      userName:  req.user.name,
      userEmail: req.user.email,
      items,
      address,
      payment,
      subtotal,
      delivery,
      tax,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discount,
      total: Math.max(0, subtotal + delivery + tax - discount),
    })

    if (appliedCoupon) await markCouponUsed(appliedCoupon, req.user._id)

    res.status(201).json({ success: true, order })
  } catch (err) {
    console.error('Place order error:', err)
    res.status(500).json({ success: false, error: 'Could not place order.' })
  }
})

/**
 * GET /api/orders/my
 * Get all orders of the logged-in user (newest first)
 */
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, orders })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch orders.' })
  }
})

/**
 * GET /api/orders/:id
 * Get a single order by _id (must belong to logged-in user OR admin)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' })

    const isOwner = order.user.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied.' })
    }

    res.json({ success: true, order })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch order.' })
  }
})

// ─────────────────────────────────────────────────────────
//  ADMIN ROUTES
// ─────────────────────────────────────────────────────────

/**
 * GET /api/orders
 * Admin: get ALL orders, newest first, with pagination
 * Query: ?page=1&limit=20&status=confirmed
 */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1
    const limit  = parseInt(req.query.limit) || 50
    const skip   = (page - 1) * limit

    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.search) {
      const rx = new RegExp(req.query.search, 'i')
      filter.$or = [{ userName: rx }, { userEmail: rx }, { orderId: rx }]
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ])

    res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('Admin fetch orders error:', err)
    res.status(500).json({ success: false, error: 'Could not fetch orders.' })
  }
})

/**
 * PATCH /api/orders/:id/status
 * Admin: update order status
 * Body: { status: 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' }
 */
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body
    const valid = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value.' })
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' })

    res.json({ success: true, order })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not update status.' })
  }
})

/**
 * GET /api/orders/admin/stats
 * Admin: quick summary numbers for dashboard
 */
router.get('/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const [total, confirmed, preparing, out_for_delivery, delivered, cancelled, revenue] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'confirmed' }),
        Order.countDocuments({ status: 'preparing' }),
        Order.countDocuments({ status: 'out_for_delivery' }),
        Order.countDocuments({ status: 'delivered' }),
        Order.countDocuments({ status: 'cancelled' }),
        Order.aggregate([
          { $match: { status: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ])

    res.json({
      success: true,
      stats: {
        total,
        confirmed,
        preparing,
        out_for_delivery,
        delivered,
        cancelled,
        revenue: revenue[0]?.total || 0,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch stats.' })
  }
})

module.exports = router