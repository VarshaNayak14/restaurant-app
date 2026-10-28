const express  = require('express')
const Order    = require('../models/Order')
const { protect, adminOnly, hasPermission } = require('../middleware/auth')
const { resolveCoupon, markCouponUsed } = require('../utils/couponHelper')
const mailer = require('../utils/mailer')   // ← NEW: bill email

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

    mailer.orderPlaced(order)   // ← NEW: bill to customer + admin alert
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
    const isAdmin = hasPermission(req.user, 'orders', 'bills', 'dashboard')
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied.' })
    }

    res.json({ success: true, order })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch order.' })
  }
})

/**
 * POST /api/orders/:id/return
 * User requests a return/refund for a delivered order.
 * Body: { reason, items } — items is an array of item ids being returned (optional -> all items)
 */
router.post('/:id/return', protect, async (req, res) => {
  try {
    const { reason, items } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' })

    const isOwner = order.user.toString() === req.user._id.toString()
    if (!isOwner) return res.status(403).json({ success: false, error: 'Access denied.' })

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, error: 'Sirf delivered orders hi return kiye ja sakte hain.' })
    }
    if (order.returnStatus && order.returnStatus !== 'none' && order.returnStatus !== 'rejected') {
      return res.status(400).json({ success: false, error: 'Is order ke liye pehle se hi return request maujood hai.' })
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Return ka reason dena zaroori hai.' })
    }

    const deliveredAt = order.updatedAt || order.createdAt
    const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 7) {
      return res.status(400).json({ success: false, error: 'Return window (7 din) khatam ho chuki hai.' })
    }

    order.returnStatus = 'requested'
    order.returnReason = reason.trim()
    order.returnItems = Array.isArray(items) && items.length ? items : order.items.map(i => i.id)
    order.returnRequestedAt = new Date()
    order.returnAdminNote = null
    await order.save()

    res.json({ success: true, order })
  } catch (err) {
    console.error('Return request error:', err)
    res.status(500).json({ success: false, error: 'Return request save nahi ho saki.' })
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
      const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
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
 * PATCH /api/orders/:id/return-status
 * Admin: approve / reject / complete a user's return request
 * Body: { returnStatus: 'approved' | 'rejected' | 'completed', adminNote }
 */
router.patch('/:id/return-status', protect, adminOnly, async (req, res) => {
  try {
    const { returnStatus, adminNote } = req.body
    const valid = ['approved', 'rejected', 'completed']
    if (!valid.includes(returnStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid return status value.' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' })
    if (order.returnStatus === 'none') {
      return res.status(400).json({ success: false, error: 'Is order ke liye koi return request nahi hai.' })
    }

    order.returnStatus = returnStatus
    order.returnAdminNote = adminNote || null
    order.returnProcessedAt = new Date()
    await order.save()

    res.json({ success: true, order })
  } catch (err) {
    console.error('Return status update error:', err)
    res.status(500).json({ success: false, error: 'Return status update nahi ho saka.' })
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