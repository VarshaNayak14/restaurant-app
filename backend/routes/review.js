const express  = require('express')
const Review   = require('../models/Review')
const Order    = require('../models/Order')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

// ─────────────────────────────────────────────────────────
//  USER ROUTES
// ─────────────────────────────────────────────────────────

/**
 * POST /api/reviews
 * Submit a rating + feedback for a dish from a DELIVERED order.
 * Body: { orderId (Mongo _id), dishId, rating, feedback }
 */
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, dishId, rating, tasteRating, images, feedback } = req.body

    if (!orderId || !dishId) {
      return res.status(400).json({ success: false, error: 'orderId and dishId are required.' })
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' })
    }

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' })

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied.' })
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, error: 'You can only review items from a delivered order.' })
    }

    const item = order.items.find(i => i.id === dishId)
    if (!item) {
      return res.status(404).json({ success: false, error: 'Dish not found in this order.' })
    }

    // Upsert: if user already reviewed this dish for this order, update it instead of erroring
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, order: order._id, dishId },
      {
        user:      req.user._id,
        userName:  req.user.name,
        order:     order._id,
        dishId,
        dishName:  item.name,
        dishImage: item.image,
        rating,
        tasteRating: tasteRating || 0,
        images:    Array.isArray(images) ? images.slice(0, 6) : [],
        feedback:  feedback || '',
      },
      { new: true, upsert: true, runValidators: true }
    )

    res.status(201).json({ success: true, review })
  } catch (err) {
    console.error('Submit review error:', err)
    res.status(500).json({ success: false, error: 'Could not submit review.' })
  }
})

/**
 * GET /api/reviews/my/:orderId
 * Get the logged-in user's reviews for a specific order (so the UI
 * knows which dishes are already rated).
 */
router.get('/my/:orderId', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id, order: req.params.orderId })
    res.json({ success: true, reviews })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch reviews.' })
  }
})

/**
 * GET /api/reviews/dish/:dishId
 * Get all reviews for a dish (public) — used on dish detail page.
 * Also returns average rating and total count.
 */
router.get('/dish/:dishId', async (req, res) => {
  try {
    const reviews = await Review.find({ dishId: req.params.dishId }).sort({ createdAt: -1 })
    const avg = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    res.json({ success: true, reviews, average: Math.round(avg * 10) / 10, count: reviews.length })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch reviews.' })
  }
})

// ─────────────────────────────────────────────────────────
//  ADMIN ROUTES
// ─────────────────────────────────────────────────────────

/**
 * GET /api/reviews
 * Admin: get all reviews, newest first.
 */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 })
    res.json({ success: true, reviews })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch reviews.' })
  }
})

module.exports = router