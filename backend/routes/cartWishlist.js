const express  = require('express')
const { protect } = require('../middleware/auth')
const User     = require('../models/User')

const router = express.Router()

// ─────────────────────────────────────────────────────────────────
//  CART ROUTES  (all protected – login required)
// ─────────────────────────────────────────────────────────────────

// GET /api/cart  → return current user's cart
router.get('/cart', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('cart')
    res.json({ success: true, cart: user.cart })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' })
  }
})

// POST /api/cart  → add / increment item  { dish: { id, name, price, image, desc, cat } }
router.post('/cart', protect, async (req, res) => {
  try {
    const { dish } = req.body
    if (!dish || !dish.id) {
      return res.status(400).json({ success: false, error: 'Dish data required.' })
    }

    const user = await User.findById(req.user._id)
    const existing = user.cart.find(i => i.id === dish.id)

    if (existing) {
      existing.qty += 1
    } else {
      user.cart.push({ ...dish, qty: 1 })
    }

    await user.save()
    res.json({ success: true, cart: user.cart })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' })
  }
})

// PATCH /api/cart/:id  → update qty  { qty: number }
router.patch('/cart/:id', protect, async (req, res) => {
  try {
    const { qty } = req.body
    const user = await User.findById(req.user._id)

    if (qty < 1) {
      // remove
      user.cart = user.cart.filter(i => i.id !== req.params.id)
    } else {
      const item = user.cart.find(i => i.id === req.params.id)
      if (!item) return res.status(404).json({ success: false, error: 'Item not found in cart.' })
      item.qty = qty
    }

    await user.save()
    res.json({ success: true, cart: user.cart })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' })
  }
})

// DELETE /api/cart/:id  → remove single item
router.delete('/cart/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.cart = user.cart.filter(i => i.id !== req.params.id)
    await user.save()
    res.json({ success: true, cart: user.cart })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' })
  }
})

// DELETE /api/cart  → clear entire cart
router.delete('/cart', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.cart = []
    await user.save()
    res.json({ success: true, cart: [] })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' })
  }
})

// ─────────────────────────────────────────────────────────────────
//  WISHLIST ROUTES  (all protected – login required)
// ─────────────────────────────────────────────────────────────────

// GET /api/wishlist  → return current user's wishlist
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wishlist')
    res.json({ success: true, wishlist: user.wishlist })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' })
  }
})

// POST /api/wishlist  → toggle (add if not present, remove if present)  { dish }
router.post('/wishlist', protect, async (req, res) => {
  try {
    const { dish } = req.body
    if (!dish || !dish.id) {
      return res.status(400).json({ success: false, error: 'Dish data required.' })
    }

    const user = await User.findById(req.user._id)
    const idx  = user.wishlist.findIndex(i => i.id === dish.id)

    if (idx !== -1) {
      user.wishlist.splice(idx, 1)   // already wishlisted → remove
    } else {
      user.wishlist.push(dish)        // not yet → add
    }

    await user.save()
    res.json({ success: true, wishlist: user.wishlist })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' })
  }
})

// DELETE /api/wishlist/:id  → remove single item
router.delete('/wishlist/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.wishlist = user.wishlist.filter(i => i.id !== req.params.id)
    await user.save()
    res.json({ success: true, wishlist: user.wishlist })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' })
  }
})

module.exports = router